import type { CardType, CharKey } from "./types";

export const CARD_TYPES: readonly CardType[] = [
  { id: 1, value: 1, points: 1, name: "별이", char: "byul_e", themeColor: "#FFD93D" },
  { id: 2, value: 2, points: 2, name: "달토", char: "dalto", themeColor: "#FFA8B6" },
  { id: 3, value: 3, points: 3, name: "페포", char: "pepo", themeColor: "#B8A1F0" },
  { id: 4, value: 4, points: 4, name: "고스트웨일", char: "ghost_whale", themeColor: "#D8D2EC" },
  { id: 5, value: 5, points: 5, name: "네이버웨일", char: "naver_whale", themeColor: "#06E6B8" },
] as const;

export const LLAMA_CARD: CardType = {
  id: "L",
  value: "LLAMA",
  points: 8,
  name: "라마",
  char: null,
  themeColor: "#FF8C5A",
  isLlama: true,
};

/** NPC 의사결정 강도. 부스 손님이 한 판은 잡고 가도록 라운드별로 다르게 설정. */
export type NpcDifficulty = "easy" | "normal";

export interface Opponent {
  name: string;
  char: CharKey;
  difficulty: NpcDifficulty;
}

export interface GameConfig {
  copiesPerNumber: number;
  copiesLlama: number;
  handSize: number;
  npcThinkDelay: number;
  /**
   * 라운드별 1대1 상대.
   * 라운드 N(1-based)의 상대는 opponents[N-1].
   * 길이가 곧 totalRounds.
   */
  opponents: ReadonlyArray<Opponent>;
}

export const CONFIG: GameConfig = {
  copiesPerNumber: 6,
  copiesLlama: 6,
  handSize: 5,
  npcThinkDelay: 1100,
  opponents: [
    // R1: 워밍업. 운영진/UI에 난이도 노출 금지.
    { name: "HYLION", char: "hylion", difficulty: "easy" },
    // R2: 진짜 승부.
    { name: "네이버웨일", char: "naver_whale", difficulty: "normal" },
  ],
};

export const TOTAL_ROUNDS = CONFIG.opponents.length;

export const CHAR_IMAGES: Record<CharKey, string> = {
  byul_e: "/characters/byul_e.png",
  dalto: "/characters/dalto.png",
  pepo: "/characters/pepo.png",
  ghost_whale: "/characters/ghost_whale.png",
  naver_whale: "/characters/naver_whale.png",
  hylion: "/characters/hylion.png",
};

export const HERO_IMAGE = "/characters/hero.jpg";
