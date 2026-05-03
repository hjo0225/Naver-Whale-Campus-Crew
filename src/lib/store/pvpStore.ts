"use client";

import { create } from "zustand";
import { onValue, ref, remove } from "firebase/database";

import { CONFIG } from "@/lib/game/data";
import {
  applyNpcStep,
  apply,
  buildInitialState,
  currentIsNpc,
} from "@/lib/pvp/engine";
import {
  clearActions,
  createRoom,
  ensureAnonAuth,
  getDb,
  joinRoom,
  pushAction,
  registerPresence,
  setStatus,
  slotKeyForUid,
  watchRoom,
  writeState,
} from "@/lib/pvp/rtdb";
import type { ActionEnvelope, Room, SlotKey } from "@/lib/pvp/schema";

/** 상대 offline → abort 까지의 유예 시간 (ms). 탭 새로고침 등 일시 끊김 흡수용. */
const ABORT_GRACE_MS = 30_000;

export type PvpPhase = "lobby" | "waiting" | "playing" | "finished" | "aborted";

interface PvpStoreInternal {
  uid: string | null;
  code: string | null;
  mySlot: SlotKey | null;
  room: Room | null;
  phase: PvpPhase;
  error: string | null;
  busy: boolean;
  unsubRoom: (() => void) | null;
  unsubActions: (() => void) | null;
  npcTimer: ReturnType<typeof setTimeout> | null;
  abortTimer: ReturnType<typeof setTimeout> | null;
}

export interface PvpStore extends PvpStoreInternal {
  init: () => Promise<void>;
  hostNew: () => Promise<void>;
  joinExisting: (input: string) => Promise<void>;
  leave: () => Promise<void>;
  /** UI: 사람이 카드 내기 시도 */
  playCard: (handIdx: number) => Promise<void>;
  /** UI: 사람이 카드 뽑기 */
  drawCard: () => Promise<void>;
  /** UI: 사람이 그만하기 */
  quit: () => Promise<void>;
  /** 운영진: 결과 화면에서 "다음 게임" → 방 정리 + lobby */
  nextGame: () => Promise<void>;
  setError: (msg: string | null) => void;
}

function inferPhase(room: Room | null): PvpPhase {
  if (!room) return "lobby";
  const status = room.meta?.status;
  if (status === "aborted") return "aborted";
  if (status === "finished") return "finished";
  if (status === "playing") return "playing";
  return "waiting";
}

export const usePvpStore = create<PvpStore>((set, get) => {
  function clearNpcTimer() {
    const t = get().npcTimer;
    if (t) {
      clearTimeout(t);
      set({ npcTimer: null });
    }
  }

  function clearAbortTimer() {
    const t = get().abortTimer;
    if (t) {
      clearTimeout(t);
      set({ abortTimer: null });
    }
  }

  /**
   * 호스트 전용: 상대(p1) presence가 ABORT_GRACE_MS 이상 offline → status=aborted.
   * presence는 watchRoom의 room.presence로 들어옴.
   */
  function maybeScheduleAbort() {
    const { code, mySlot, room } = get();
    if (mySlot !== "p0" || !code) return;
    if (!room || room.meta?.status === "aborted" || room.meta?.status === "finished") return;
    const otherUid = room.slots?.p1?.uid;
    if (!otherUid) return;
    const presence = room.presence?.[otherUid];
    if (!presence) return;
    if (presence.online) {
      clearAbortTimer();
      return;
    }
    if (get().abortTimer) return; // 이미 예약됨
    const t = setTimeout(async () => {
      const cur = get().room;
      const stillOffline = cur?.presence?.[otherUid]?.online === false;
      if (stillOffline && cur?.meta?.status !== "finished") {
        await setStatus(code, "aborted").catch(() => {});
      }
      set({ abortTimer: null });
    }, ABORT_GRACE_MS);
    set({ abortTimer: t });
  }

  /** 호스트 전용: 현재 턴이 NPC면 일정 지연 후 한 스텝 진행 + 상태 write. */
  function maybeScheduleNpc() {
    clearNpcTimer();
    const { code, mySlot, room } = get();
    if (mySlot !== "p0" || !code) return;
    const state = room?.state;
    if (!state || state.phase !== "playing") return;
    if (!currentIsNpc(state)) return;
    const t = setTimeout(async () => {
      const cur = get().room?.state;
      if (!cur || cur.phase !== "playing" || !currentIsNpc(cur)) return;
      const next = applyNpcStep(cur);
      if (next !== cur) {
        await writeState(code, next);
        if (next.phase === "finished") {
          await setStatus(code, "finished");
        }
      }
    }, CONFIG.npcThinkDelay);
    set({ npcTimer: t });
  }

  /** 호스트 전용: /actions 큐를 listen + 들어오는 사람 액션을 engine에 흘림. */
  function startHostActionConsumer(code: string) {
    const aRef = ref(getDb(), `rooms/${code}/actions`);
    const unsub = onValue(aRef, async (snap) => {
      if (!snap.exists()) return;
      const raw = snap.val() as Record<string, ActionEnvelope>;
      const ordered = Object.entries(raw)
        .map(([k, v]) => ({ key: k, env: v }))
        .sort((a, b) => a.env.ts - b.env.ts);
      let state = get().room?.state ?? null;
      if (!state) return;
      let changed = false;
      for (const { env } of ordered) {
        const next = apply(state, env, env.seat);
        if (next !== state) {
          state = next;
          changed = true;
        }
      }
      if (changed && state) {
        await writeState(code, state);
        if (state.phase === "finished") await setStatus(code, "finished");
      }
      // 적용 끝 — 큐 비우기
      await remove(aRef);
    });
    return unsub;
  }

  function attachRoomWatcher(code: string, uid: string) {
    return watchRoom(code, (room) => {
      const mySlot = slotKeyForUid(room, uid);
      const phase = inferPhase(room);
      set({ room, mySlot, phase });

      // 호스트 전이 1: 양쪽 슬롯 다 차고 아직 waiting → 게임 state 초기화 + status=playing
      if (
        mySlot === "p0" &&
        room?.meta?.status === "waiting" &&
        room?.slots?.p0 &&
        room?.slots?.p1 &&
        !room?.state
      ) {
        void (async () => {
          const init = buildInitialState({
            hostName: "P1",
            guestName: "P2",
            hostUid: room.slots.p0!.uid,
            guestUid: room.slots.p1!.uid,
          });
          await writeState(code, init);
          await setStatus(code, "playing");
        })();
        return;
      }

      // 호스트: 매 state 변화마다 NPC 턴 + presence 기반 abort 체크
      if (mySlot === "p0") {
        maybeScheduleNpc();
        maybeScheduleAbort();
      }
    });
  }

  return {
    uid: null,
    code: null,
    mySlot: null,
    room: null,
    phase: "lobby",
    error: null,
    busy: false,
    unsubRoom: null,
    unsubActions: null,
    npcTimer: null,
    abortTimer: null,

    init: async () => {
      if (get().uid) return;
      const uid = await ensureAnonAuth();
      set({ uid });
    },

    hostNew: async () => {
      set({ busy: true, error: null });
      try {
        await get().init();
        const uid = get().uid!;
        const code = await createRoom(uid);
        const unsubRoom = attachRoomWatcher(code, uid);
        const unsubActions = startHostActionConsumer(code);
        await registerPresence(code, uid);
        set({ code, mySlot: "p0", unsubRoom, unsubActions, busy: false });
      } catch (e) {
        set({ busy: false, error: e instanceof Error ? e.message : String(e) });
      }
    },

    joinExisting: async (input) => {
      set({ busy: true, error: null });
      try {
        await get().init();
        const uid = get().uid!;
        const code = input.trim().toUpperCase();
        await joinRoom(code, uid);
        const unsubRoom = attachRoomWatcher(code, uid);
        await registerPresence(code, uid);
        set({ code, mySlot: "p1", unsubRoom, busy: false });
      } catch (e) {
        set({ busy: false, error: e instanceof Error ? e.message : String(e) });
      }
    },

    leave: async () => {
      const { unsubRoom, unsubActions } = get();
      if (unsubRoom) unsubRoom();
      if (unsubActions) unsubActions();
      clearNpcTimer();
      clearAbortTimer();
      set({
        code: null,
        room: null,
        mySlot: null,
        phase: "lobby",
        unsubRoom: null,
        unsubActions: null,
      });
    },

    playCard: async (handIdx) => {
      const { code, uid, mySlot, room } = get();
      if (!code || !uid || !mySlot) return;
      const seat = mySlot === "p0" ? 0 : 1;
      if (room?.state?.currentTurn !== seat) return;
      await pushAction(code, {
        by: uid,
        type: "play",
        payload: { handIdx },
        ts: Date.now(),
        seat,
      });
    },

    drawCard: async () => {
      const { code, uid, mySlot, room } = get();
      if (!code || !uid || !mySlot) return;
      const seat = mySlot === "p0" ? 0 : 1;
      if (room?.state?.currentTurn !== seat) return;
      await pushAction(code, {
        by: uid,
        type: "draw",
        ts: Date.now(),
        seat,
      });
    },

    quit: async () => {
      const { code, uid, mySlot, room } = get();
      if (!code || !uid || !mySlot) return;
      const seat = mySlot === "p0" ? 0 : 1;
      if (room?.state?.currentTurn !== seat) return;
      await pushAction(code, {
        by: uid,
        type: "quit",
        ts: Date.now(),
        seat,
      });
    },

    nextGame: async () => {
      const { code } = get();
      if (!code) {
        await get().leave();
        return;
      }
      // 운영진이 부스에서 한쪽 노트북에서만 누르면 OK — 양쪽 다 lobby로 빠져야 함.
      // 가장 단순: 방 자체를 abort 처리해 양쪽이 leave → lobby.
      try {
        await setStatus(code, "aborted");
      } catch {
        // 이미 사라진 방이면 무시
      }
      // 약간 지연 후 leave (상대 클라가 aborted를 보고 자체 leave할 시간)
      setTimeout(() => {
        void get().leave();
        // 방 자체 정리 (호스트만)
        if (get().mySlot === "p0") {
          void clearActions(code);
          void remove(ref(getDb(), `rooms/${code}`));
        }
      }, 600);
    },

    setError: (msg) => set({ error: msg }),
  };
});

/** UI 헬퍼 — 컴포넌트에서 selector로 직접 호출. */
export function selectMySeat(s: PvpStore): 0 | 1 | null {
  if (!s.mySlot) return null;
  return s.mySlot === "p0" ? 0 : 1;
}
