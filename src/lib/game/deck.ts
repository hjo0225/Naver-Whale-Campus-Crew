import { CARD_TYPES, CONFIG, LLAMA_CARD } from "./data";
import type { Card } from "./types";

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let uid = 0;
  for (const c of CARD_TYPES) {
    for (let i = 0; i < CONFIG.copiesPerNumber; i++) {
      deck.push({ ...c, uid: uid++ });
    }
  }
  for (let i = 0; i < CONFIG.copiesLlama; i++) {
    deck.push({ ...LLAMA_CARD, uid: uid++ });
  }
  return deck;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
