import type { Card, CharKey, GameState, PlayerSummary, RoundHistoryEntry } from "@/lib/game/types";

/** RTDB `/rooms/{CODE}` 한 방의 전체 스키마. */
export interface Room {
  meta: RoomMeta;
  slots: RoomSlots;
  state?: RoomState | null;
  actions?: Record<string, ActionEnvelope> | null;
  presence?: Record<string, PresenceEntry> | null;
}

export type RoomStatus = "waiting" | "playing" | "finished" | "aborted";

/**
 * 방이 중단된 사유.
 *  - host-left: 호스트가 게임 중 명시적으로 나감
 *  - host-end: 호스트가 결과 화면에서 "다음 게임" 또는 정상 종료
 *  - host-disconnect: 호스트의 창이 닫히거나 네트워크 끊김 (onDisconnect 발동 → 방 자체 삭제)
 *  - player-left: 게스트 한 명이 게임 중 떠나거나 끊김
 */
export type AbortReason = "host-left" | "host-end" | "host-disconnect" | "player-left";

export interface RoomMeta {
  createdAt: number;
  hostUid: string;
  status: RoomStatus;
  /** 호스트가 시작 누른 시점 잡힌 사람 수 (2~4). state 빌드에 그대로 사용. */
  startedWith?: number | null;
  /** status === "aborted" 일 때만 의미. 모달 메시지 분기에 사용. */
  abortReason?: AbortReason | null;
}

export interface RoomSlots {
  p0?: SlotEntry | null;
  p1?: SlotEntry | null;
  p2?: SlotEntry | null;
  p3?: SlotEntry | null;
}

export interface SlotEntry {
  uid: string;
  joinedAt: number;
  /** 손님이 입력한 닉네임. 없으면 보드 표시는 P1~P4로 폴백. */
  name?: string;
}

/** 호스트만 write. 게임의 진행 상태 전체 스냅샷. */
export interface RoomState {
  deck: Card[];
  top: Card | null;
  currentTurn: number;
  phase: "playing" | "finished";
  players: RoomPlayer[];
  round: number;
  totalRounds: number;
  totalScores: Record<string, number>;
  roundHistory: RoundHistoryEntry[];
  summary: PlayerSummary | null;
  /** 매 set마다 +1, 동시 갱신 충돌 감지용. */
  version: number;
}

export interface RoomPlayer {
  /** 0..numHumans-1 = 사람 (0=호스트), numHumans..3 = NPC */
  seat: number;
  name: string;
  isPlayer: boolean;
  /** 사람일 때만 채워짐 (slot의 uid와 동일) */
  uid: string | null;
  char: CharKey | null;
  hand: Card[];
  quitted: boolean;
  lastAction: GameState["players"][number]["lastAction"];
}

export interface ActionEnvelope {
  by: string;
  type: "play" | "draw" | "quit";
  payload?: { handIdx?: number };
  ts: number;
  seat: number;
}

export interface PresenceEntry {
  online: boolean;
  lastSeen: number;
}

/** UI용 슬롯 키 — p0 = 호스트, p1~p3 = 게스트. */
export type SlotKey = "p0" | "p1" | "p2" | "p3";

export const SLOT_KEYS: readonly SlotKey[] = ["p0", "p1", "p2", "p3"];

/** room.slots에 들어있는 사람 수를 반환 (0~4). */
export function countSlots(slots: RoomSlots | undefined): number {
  if (!slots) return 0;
  return SLOT_KEYS.reduce((acc, k) => (slots[k]?.uid ? acc + 1 : acc), 0);
}
