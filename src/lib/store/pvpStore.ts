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
  watchOpenRooms,
  watchRoom,
  writeState,
  type PublicRoomSummary,
} from "@/lib/pvp/rtdb";
import { SLOT_KEYS, countSlots, type ActionEnvelope, type Room, type SlotKey } from "@/lib/pvp/schema";

/** 상대 offline → abort 까지의 유예 시간 (ms). 탭 새로고침 등 일시 끊김 흡수용. */
const ABORT_GRACE_MS = 30_000;

/** 닉네임 영속 키 — 한 번 입력하면 새로고침/재방문에도 유지. */
const NICKNAME_KEY = "pvp:nickname";
/** 코드포인트 기준 최대 길이 (한글/이모지 모두 1글자로 카운트). */
export const NICKNAME_MAX = 8;

/** trim + 코드포인트 기준 자르기. 빈 문자열이면 그대로 빈 문자열 반환. */
export function sanitizeNickname(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const arr = Array.from(trimmed);
  return arr.slice(0, NICKNAME_MAX).join("");
}

/** 클라이언트에서만 호출 — localStorage에서 닉네임 읽어옴. */
export function loadStoredNickname(): string {
  if (typeof window === "undefined") return "";
  try {
    return sanitizeNickname(window.localStorage.getItem(NICKNAME_KEY) ?? "");
  } catch {
    return "";
  }
}

function persistNickname(name: string): void {
  if (typeof window === "undefined") return;
  try {
    if (name) window.localStorage.setItem(NICKNAME_KEY, name);
    else window.localStorage.removeItem(NICKNAME_KEY);
  } catch {
    // localStorage 쓰기 실패는 조용히 무시 (시크릿 모드 등)
  }
}

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
  /** 로비에 표시할 모집중인 방 목록 */
  openRooms: PublicRoomSummary[];
  unsubLobby: (() => void) | null;
  /** 손님 닉네임. 빈 문자열이면 미설정 (로비 게이트 노출). */
  nickname: string;
}

export interface PvpStore extends PvpStoreInternal {
  init: () => Promise<void>;
  hostNew: () => Promise<void>;
  joinExisting: (input: string) => Promise<void>;
  /** 호스트가 현재 인원으로 게임 시작 (사람 2~4 + NPC 자동 채움) */
  startGame: () => Promise<void>;
  /** 로비 진입 시 모집중 방 목록 구독 시작 */
  watchLobby: () => Promise<void>;
  /** 로비 떠날 때 구독 정리 */
  unwatchLobby: () => void;
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
  /** 닉네임 갱신 (sanitize 후 저장 + localStorage 영속). */
  setNickname: (name: string) => void;
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
   * 호스트 전용: 게임 진행 중인 사람 상대 중 누구라도 ABORT_GRACE_MS 이상 offline → status=aborted.
   * 대기 중(state 없음) 단계에서는 abort 검사하지 않음 (들어왔다 나가는 자유 허용).
   */
  function maybeScheduleAbort() {
    const { code, mySlot, room } = get();
    if (mySlot !== "p0" || !code) return;
    if (!room || room.meta?.status !== "playing") return;
    const players = room.state?.players ?? [];
    const otherHumanUids = players
      .filter((p) => p.isPlayer && p.uid && p.uid !== room.slots?.p0?.uid)
      .map((p) => p.uid as string);
    if (otherHumanUids.length === 0) return;
    const offline = otherHumanUids.find(
      (u) => room.presence?.[u]?.online === false
    );
    if (!offline) {
      clearAbortTimer();
      return;
    }
    if (get().abortTimer) return; // 이미 예약됨
    const t = setTimeout(async () => {
      const cur = get().room;
      const stillOffline = cur?.presence?.[offline]?.online === false;
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

      // 호스트: 매 state 변화마다 NPC 턴 + presence 기반 abort 체크
      // 게임 시작은 호스트가 startGame() 호출로 명시 트리거.
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
    openRooms: [],
    unsubLobby: null,
    // SSR 안전 — 초기엔 빈 문자열, mount 후 PvpLobby가 loadStoredNickname 으로 hydrate.
    nickname: "",

    setNickname: (name) => {
      const clean = sanitizeNickname(name);
      persistNickname(clean);
      set({ nickname: clean });
    },

    init: async () => {
      if (get().uid) return;
      const uid = await ensureAnonAuth();
      set({ uid });
    },

    hostNew: async () => {
      const nickname = get().nickname;
      if (!nickname) {
        set({ error: "닉네임을 먼저 입력해주세요" });
        return;
      }
      set({ busy: true, error: null });
      try {
        await get().init();
        const uid = get().uid!;
        const code = await createRoom(uid, nickname);
        const unsubRoom = attachRoomWatcher(code, uid);
        const unsubActions = startHostActionConsumer(code);
        await registerPresence(code, uid);
        set({ code, mySlot: "p0", unsubRoom, unsubActions, busy: false });
      } catch (e) {
        set({ busy: false, error: e instanceof Error ? e.message : String(e) });
      }
    },

    joinExisting: async (input) => {
      const nickname = get().nickname;
      if (!nickname) {
        set({ error: "닉네임을 먼저 입력해주세요" });
        return;
      }
      set({ busy: true, error: null });
      try {
        await get().init();
        const uid = get().uid!;
        const code = input.trim().toUpperCase();
        const slot = await joinRoom(code, uid, nickname);
        const unsubRoom = attachRoomWatcher(code, uid);
        await registerPresence(code, uid);
        set({ code, mySlot: slot, unsubRoom, busy: false });
      } catch (e) {
        set({ busy: false, error: e instanceof Error ? e.message : String(e) });
      }
    },

    watchLobby: async () => {
      if (get().unsubLobby) return; // 이미 구독중
      try {
        await get().init();
        const unsub = watchOpenRooms((rooms) => set({ openRooms: rooms }));
        set({ unsubLobby: unsub });
      } catch (e) {
        set({ error: e instanceof Error ? e.message : String(e) });
      }
    },

    unwatchLobby: () => {
      const u = get().unsubLobby;
      if (u) {
        u();
        set({ unsubLobby: null, openRooms: [] });
      }
    },

    startGame: async () => {
      const { code, mySlot, room } = get();
      if (!code || mySlot !== "p0" || !room) return;
      if (room.meta?.status !== "waiting") return;
      // 시점 사진 — 시작 누른 시점에 들어와있던 사람들로 좌석 결정.
      const slots = room.slots;
      if (!slots) return;
      // 동명이인 시 결과 매칭이 어긋나지 않도록 suffix `(2)`, `(3)` 부여.
      const seen = new Map<string, number>();
      const humans: { uid: string; name: string; key: SlotKey }[] = [];
      SLOT_KEYS.forEach((k, i) => {
        const s = slots[k];
        if (s?.uid) {
          const base = s.name?.trim() || `P${i + 1}`;
          const count = (seen.get(base) ?? 0) + 1;
          seen.set(base, count);
          const name = count === 1 ? base : `${base}(${count})`;
          humans.push({ uid: s.uid, name, key: k });
        }
      });
      if (humans.length < 2) {
        set({ error: "최소 2명이 모여야 시작할 수 있어요" });
        return;
      }
      try {
        const init = buildInitialState({
          humans: humans.map((h) => ({ uid: h.uid, name: h.name })),
        });
        await writeState(code, init);
        await setStatus(code, "playing");
      } catch (e) {
        set({ error: e instanceof Error ? e.message : String(e) });
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
      const { code, uid, room } = get();
      if (!code || !uid) return;
      const seat = seatForUid(room, uid);
      if (seat === null || room?.state?.currentTurn !== seat) return;
      await pushAction(code, {
        by: uid,
        type: "play",
        payload: { handIdx },
        ts: Date.now(),
        seat,
      });
    },

    drawCard: async () => {
      const { code, uid, room } = get();
      if (!code || !uid) return;
      const seat = seatForUid(room, uid);
      if (seat === null || room?.state?.currentTurn !== seat) return;
      await pushAction(code, {
        by: uid,
        type: "draw",
        ts: Date.now(),
        seat,
      });
    },

    quit: async () => {
      const { code, uid, room } = get();
      if (!code || !uid) return;
      const seat = seatForUid(room, uid);
      if (seat === null || room?.state?.currentTurn !== seat) return;
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

/** state.players에서 uid가 차지한 seat 번호를 찾는다. 게임 시작 전이면 null. */
export function seatForUid(room: Room | null, uid: string): number | null {
  const players = room?.state?.players;
  if (!players) return null;
  const idx = players.findIndex((p) => p.uid === uid);
  return idx >= 0 ? idx : null;
}

/** UI 헬퍼 — 컴포넌트에서 selector로 직접 호출. 게임 시작 전이면 null. */
export function selectMySeat(s: PvpStore): number | null {
  if (!s.uid) return null;
  return seatForUid(s.room, s.uid);
}

/** 현재 방 인원 수 (사람 슬롯 점유 수). */
export function selectHumanCount(s: PvpStore): number {
  return countSlots(s.room?.slots);
}
