export type CharKey =
  | "byul_e"
  | "dalto"
  | "pepo"
  | "ghost_whale"
  | "naver_whale"
  | "hylion";

export type CardValue = 1 | 2 | 3 | 4 | 5 | "LLAMA";

export interface CardType {
  readonly id: number | "L";
  readonly value: CardValue;
  readonly points: number;
  readonly name: string;
  readonly char: CharKey | null;
  readonly themeColor: string;
  readonly isLlama?: boolean;
}

export interface Card extends CardType {
  readonly uid: number;
}

export type Action =
  | { type: "play"; card: Card }
  | { type: "draw" }
  | { type: "quit" };

export interface Player {
  name: string;
  hand: Card[];
  quitted: boolean;
  isPlayer: boolean;
  lastAction: Action | null;
  char: CharKey | null;
}

export interface RoundScore {
  name: string;
  isPlayer: boolean;
  score: number;
  hand: Card[];
  /** 1~4. 점수 낮을수록 1등. 동점은 손님이 더 높은 등수 (부스 우호) */
  place: number;
  quitted: boolean;
}

/** 4인 한 판의 결과. 1라운드만 존재. */
export interface RoundHistoryEntry {
  round: number;
  scores: RoundScore[];
  /** 손님 등수 (1~totalPlayers) */
  playerPlace: number;
}

export type GamePhase = "playing" | "roundEnded" | "finished";

export interface GameState {
  players: Player[];
  deck: Card[];
  top: Card | null;
  currentTurn: number;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  /** 누적 점수 (참고용, 승리 결정에는 사용하지 않음) */
  totalScores: Record<string, number>;
  roundHistory: RoundHistoryEntry[];
}

/** 게임 종료 시 손님의 결과 (상품 결정에 사용) */
export interface PlayerSummary {
  /** 손님 등수 (1~totalPlayers) */
  place: number;
  totalPlayers: number;
  /** 1등 → both, 2·3등 → one, 4등(꼴등) → cheer */
  prize: "both" | "one" | "cheer";
}
