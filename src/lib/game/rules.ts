import type { Card, CardValue, CharKey, Player } from "./types";

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

/**
 * 라운드 종료 사유를 현재 플레이어 상태에서 파생.
 * gameStore.checkRoundEnd 의 분기와 의미적으로 일치하지만, 사후(phase=finished) 관찰용.
 */
export type EndReason =
  | { type: "out"; name: string; char: CharKey | null }
  | { type: "all-quit" }
  | { type: "deadlock"; name: string };

export function deriveEndReason(players: readonly Player[]): EndReason | null {
  const out = players.find((p) => p.hand.length === 0 && !p.quitted);
  if (out) return { type: "out", name: out.name, char: out.char };

  const active = players.filter((p) => !p.quitted);
  if (active.length === 0) return { type: "all-quit" };
  if (active.length === 1) {
    const last = active[0]!;
    return { type: "deadlock", name: last.name };
  }
  return null;
}

export function describeEndReason(r: EndReason): { emoji: string; line: string } {
  if (r.type === "out") return { emoji: "🏁", line: `${r.name}님이 카드를 다 냈습니다.` };
  if (r.type === "all-quit") return { emoji: "✋", line: "모두 그만했어요" };
  return { emoji: "🚫", line: `${r.name} 낼 카드 없음` };
}
