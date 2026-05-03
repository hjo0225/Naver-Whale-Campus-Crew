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

export interface RoomMeta {
  createdAt: number;
  hostUid: string;
  status: RoomStatus;
}

export interface RoomSlots {
  p0?: SlotEntry | null;
  p1?: SlotEntry | null;
}

export interface SlotEntry {
  uid: string;
  joinedAt: number;
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
  /** 0=호스트, 1=게스트(사람), 2~3=NPC */
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

/** UI용 슬롯 키 — p0 = 호스트, p1 = 게스트. */
export type SlotKey = "p0" | "p1";
