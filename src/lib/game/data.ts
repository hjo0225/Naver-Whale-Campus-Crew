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

export interface Opponent {
  name: string;
  char: CharKey;
}

export interface GameConfig {
  copiesPerNumber: number;
  copiesLlama: number;
  handSize: number;
  npcThinkDelay: number;
  /** 한 판의 NPC들 (4인전이라 길이 = 3). */
  opponents: ReadonlyArray<Opponent>;
}

export const CONFIG: GameConfig = {
  copiesPerNumber: 6,
  copiesLlama: 6,
  handSize: 4,
  // 진행속도 1/2 (이전 1100ms → 2200ms). 부스에서 카드 흐름을 또렷이 보이려고 천천히.
  npcThinkDelay: 2200,
  opponents: [
    { name: "달토", char: "dalto" },
    { name: "페포", char: "pepo" },
    { name: "웨일", char: "naver_whale" },
  ],
};

/** 4인 한 판 — 라운드는 항상 1. */
export const TOTAL_ROUNDS = 1;

export const CHAR_IMAGES: Record<CharKey, string> = {
  byul_e: "/characters/byul_e.png",
  dalto: "/characters/dalto.png",
  pepo: "/characters/pepo.png",
  ghost_whale: "/characters/ghost_whale.png",
  naver_whale: "/characters/naver_whale.png",
  hylion: "/characters/hylion.png",
};

export const HERO_IMAGE = "/characters/hero.jpg";
