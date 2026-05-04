"use client";

import { create } from "zustand";
import { onValue, ref } from "firebase/database";

import { CONFIG } from "@/lib/game/data";
import {
  applyNpcStep,
  apply,
  buildInitialState,
  currentIsNpc,
} from "@/lib/pvp/engine";
import {
  abortRoom,
  cancelGuestSlotDisconnect,
  cancelHostDisconnectCleanup,
  clearActions,
  clearMySlot,
  createRoom,
  deleteRoom,
  ensureAnonAuth,
  getDb,
  joinRoom,
  pushAction,
  registerGuestSlotDisconnect,
  registerHostDisconnectCleanup,
  registerPresence,
  setPresenceOffline,
  setStatus,
  slotKeyForUid,
  watchOpenRooms,
  watchRoom,
  writeState,
  type PublicRoomSummary,
} from "@/lib/pvp/rtdb";
import {
  SLOT_KEYS,
  countSlots,
  type AbortReason,
  type ActionEnvelope,
  type Room,
  type SlotKey,
} from "@/lib/pvp/schema";

/**
 * 상대 offline → abort 까지의 유예 시간 (ms).
 * 너무 짧으면 탭 새로고침/모바일 잠시 잠금에도 게임이 끊김 → 5초로 균형.
 * 의도적 leave 도 같은 경로로 흐르므로 게스트가 명시적으로 나가도 5초 후 호스트가 abort 처리.
 */
const ABORT_GRACE_MS = 5_000;
/** 호스트 abort 후 게스트가 모달 보고 leave할 시간 + 호스트가 방 삭제 직전 grace. */
const ABORT_DELETE_DELAY_MS = 600;

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
  /**
   * 방이 aborted 일 때 모달 메시지 분기용. RTDB 의 meta.abortReason 을 미러.
   * 호스트가 onDisconnect 으로 방을 통째로 지우고 사라진 경우 (meta 안 읽힘),
   * 직전 room 스냅샷 + role 추론으로 "host-disconnect" 부여.
   */
  abortReason: AbortReason | null;
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
  /**
   * 탭이 백그라운드에서 다시 활성화될 때 호출. setTimeout 이 백그라운드에서
   * 1Hz 로 throttle 되어 NPC 턴/abort 검사가 늦어지는 문제 회복용.
   */
  wake: () => void;
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
   * 호스트 전용: 게임 진행 중인 사람 상대 중 누구라도 ABORT_GRACE_MS 이상 offline → 방 abort.
   * 게스트가 명시적으로 leave 를 누른 경우도 setPresenceOffline 으로 같은 경로를 탐 →
   * grace 후 abortRoom("player-left").
   * 대기 중(waiting) 단계에서는 abort 검사하지 않음 (게스트가 자유롭게 들어왔다 나갈 수 있음).
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
      if (stillOffline && cur?.meta?.status === "playing") {
        await abortRoom(code, "player-left").catch(() => {});
        // 방 자체 삭제는 호스트의 leave() (모달 → 자동 leave) 시점에 수행 →
        // 게스트들이 모달을 받고 자체 leave 하기 전에 방이 사라지지 않도록 함.
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
      // 적용 끝 — 큐 비우기 (RTDB 규칙: actions 부모 .write 가 host 에게만 허용)
      await clearActions(code).catch(() => {});
    });
    return unsub;
  }

  function attachRoomWatcher(code: string, uid: string) {
    return watchRoom(code, (room) => {
      const prev = get().room;

      // 방이 사라진 경우 — 호스트가 명시적으로 삭제했거나, 호스트의 onDisconnect 가 발동.
      if (room === null) {
        if (prev !== null) {
          const prevStatus = prev.meta?.status;

          // 이미 모달이 표시 중인 상태에서 호스트가 600ms 후 방을 삭제하는 정상 경로 →
          // phase 를 그대로 두고 room 만 null 처리해서 모달의 3초 자동 leave 가 끝까지 살게 함.
          if (prevStatus === "aborted") {
            set({ room: null, mySlot: null });
            return;
          }

          // 게임 활성(waiting/playing) 중에 방이 사라지면 abort 모달을 봐야 함.
          // host 가 abortRoom 안 거치고 곧장 삭제한 경우 = onDisconnect 발동 = host-disconnect.
          if (prevStatus === "waiting" || prevStatus === "playing") {
            const reason: AbortReason =
              (prev.meta?.abortReason as AbortReason | undefined) ??
              get().abortReason ??
              "host-disconnect";
            clearNpcTimer();
            clearAbortTimer();
            set({
              room: null,
              mySlot: null,
              phase: "aborted",
              abortReason: reason,
            });
            return;
          }
        }
        // 정상 종료(finished 후 삭제) 또는 처음부터 방이 없던 경우 → 조용히 lobby
        clearNpcTimer();
        clearAbortTimer();
        set({
          room: null,
          mySlot: null,
          phase: "lobby",
          abortReason: null,
        });
        return;
      }

      const mySlot = slotKeyForUid(room, uid);
      const phase = inferPhase(room);
      const abortReason = (room.meta?.abortReason as AbortReason | undefined) ?? null;

      // waiting → playing 전이 시 게스트의 슬롯-onDisconnect 취소
      // (게임 시작 후 슬롯이 사라지면 state.players 의 좌석 매핑이 깨짐)
      const wasWaiting = prev?.meta?.status === "waiting";
      const nowPlaying = room.meta?.status === "playing";
      if (wasWaiting && nowPlaying && mySlot && mySlot !== "p0") {
        void cancelGuestSlotDisconnect(code, mySlot).catch(() => {});
      }

      set({ room, mySlot, phase, abortReason });

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
    abortReason: null,
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
        // 호스트의 비정상 종료(창 닫기/네트워크) 시 방 자체를 자동 삭제 →
        // 게스트들은 watchRoom 에서 null 받고 host-disconnect 로 추론하여 모달 표시.
        await registerHostDisconnectCleanup(code).catch(() => {});
        set({
          code,
          mySlot: "p0",
          unsubRoom,
          unsubActions,
          phase: "waiting",
          abortReason: null,
          busy: false,
        });
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
        // waiting 단계에서만 슬롯 자동 정리. 게임 시작(waiting→playing) 시
        // attachRoomWatcher 가 cancelGuestSlotDisconnect 호출해서 취소한다.
        if (slot !== "p0") {
          await registerGuestSlotDisconnect(code, slot).catch(() => {});
        }
        set({
          code,
          mySlot: slot,
          unsubRoom,
          phase: "waiting",
          abortReason: null,
          busy: false,
        });
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
      const {
        unsubRoom,
        unsubActions,
        mySlot,
        code,
        room,
        uid,
      } = get();

      // 1) 워처/타이머 먼저 끊기 — 이후 setStatus/delete 로 인한 watcher 콜백이
      //    내 phase 를 "aborted" 로 다시 바꾸는 일이 없도록.
      if (unsubRoom) unsubRoom();
      if (unsubActions) unsubActions();
      clearNpcTimer();
      clearAbortTimer();

      // 2) 역할별 DB 정리 (best-effort — 실패해도 로컬 state 는 lobby 로 복귀)
      if (code && room) {
        const isHost = mySlot === "p0";
        const status = room.meta?.status;
        try {
          if (isHost) {
            // 호스트 onDisconnect 자동 삭제는 의도적 leave 와 중복되므로 취소.
            await cancelHostDisconnectCleanup(code).catch(() => {});
            // 게임 활성 상태(waiting/playing) 에서 호스트가 나가면 게스트들에게
            // 모달을 띄우기 위해 abort + 사유 기록 → 600ms 대기 → 방 삭제.
            // finished/aborted 면 모달 불필요 (결과 화면 봤거나 이미 모달 본 상태) → 그냥 삭제.
            if (status === "waiting" || status === "playing") {
              await abortRoom(code, "host-left").catch(() => {});
              await new Promise((r) => setTimeout(r, ABORT_DELETE_DELAY_MS));
            }
            await clearActions(code).catch(() => {});
            await deleteRoom(code).catch(() => {});
          } else {
            // 게스트
            if (mySlot) {
              await cancelGuestSlotDisconnect(code, mySlot).catch(() => {});
              if (status === "waiting") {
                // 대기 중이면 슬롯만 비우고 방은 살려둠 — 다른 사람들 진행 가능
                await clearMySlot(code, mySlot).catch(() => {});
              }
              // playing 이면 슬롯은 그대로 (state.players 매핑 보존). 호스트가
              // presence offline 감지 → ABORT_GRACE_MS 후 abortRoom("player-left").
            }
            if (uid) {
              await setPresenceOffline(code, uid).catch(() => {});
            }
          }
        } catch {
          // silent
        }
      }

      set({
        code: null,
        room: null,
        mySlot: null,
        phase: "lobby",
        abortReason: null,
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
      // 결과 화면(finished)에서 호스트가 "다음 게임" 클릭 → leave() 가 알아서
      // status 가 finished 임을 보고 abort 모달 없이 방 삭제 + 본인 lobby 로 복귀.
      // 게스트들은 watchRoom 콜백으로 room=null + prev.status="finished" 받고
      // attachRoomWatcher 의 "wasGameActive=false" 분기로 조용히 lobby 로 이동.
      await get().leave();
    },

    setError: (msg) => set({ error: msg }),

    wake: () => {
      // 백그라운드 throttle 후 활성화 시 재진입 — 호스트만 의미 있음.
      if (get().mySlot !== "p0") return;
      maybeScheduleNpc();
      maybeScheduleAbort();
    },
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
