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
  score: number;
  hand: Card[];
}

/** 1라운드(1 vs 1) 의 결과 */
export interface RoundHistoryEntry {
  round: number;
  scores: RoundScore[];
  /**
   * 손님(=isPlayer) 입장에서의 결과.
   * 점수가 같거나 낮으면 win, 높으면 lose. (부스 분위기 위해 무승부도 손님 승)
   */
  outcome: "win" | "lose";
  /** 동점이었는지 (UI에서 "동점이지만 승!" 메시지용) */
  wasTie: boolean;
  /** 이 라운드의 NPC 이름 (UI에서 "HYLION 전 / 네이버웨일 전" 표시용) */
  opponentName: string;
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
  wins: number;
  totalRounds: number;
  /** 2승이면 키캡+인형 둘 다, 그 외엔 택1 */
  prize: "both" | "one";
}
