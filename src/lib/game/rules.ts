import type { Card, CardValue } from "./types";

/**
 * 매칭 규칙:
 *  - 같은 숫자
 *  - +1 (숫자끼리만)
 *  - 5 위에는 라마
 *  - 라마 위에는 1
 */
export function canPlay(card: Card, top: Card | null): boolean {
  if (!top) return true;
  if (card.value === top.value) return true;
  if (
    typeof top.value === "number" &&
    typeof card.value === "number" &&
    card.value === top.value + 1
  ) {
    return true;
  }
  if (top.value === 5 && card.value === "LLAMA") return true;
  if (top.value === "LLAMA" && card.value === 1) return true;
  return false;
}

/**
 * 점수 계산: 손에 남은 카드 점수 합산.
 * 단, 같은 카드 여러 장이어도 1회만 카운트 (의도된 룰).
 */
export function calculateScore(hand: readonly Card[]): number {
  const seen = new Map<CardValue, number>();
  for (const c of hand) {
    if (!seen.has(c.value)) seen.set(c.value, c.points);
  }
  let total = 0;
  for (const p of seen.values()) total += p;
  return total;
}

export function formatScore(p: number): string {
  return p === 0 ? "0" : "-" + p;
}
