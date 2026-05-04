import { canPlay, calculateScore } from "./rules";
import type { Card, GameState, Player } from "./types";

export type NpcDecision =
  | { type: "play"; handIdx: number; card: Card }
  | { type: "draw" }
  | { type: "quit" };

/** 손패 카드 수가 이 값 이하일 때만 그만하기를 고려. */
export const QUIT_HAND_THRESHOLD = 5;
/** 손패 점수가 이 값 미만일 때만 그만하기를 고려 — 5점 이상 쌓이면 NPC는 절대 quit 안 함 (부스 우호). */
export const QUIT_SCORE_THRESHOLD = 5;
/** 손패·점수 임계 모두 통과 시 매 턴 그만하기 확률. */
export const QUIT_PROBABILITY = 0.3;

/**
 * NPC 의사결정 — 부스 우호형.
 *
 *  - 낼 수 있는 카드가 있으면 가장 점수가 큰 카드부터 던진다 (라마 우선 폐기).
 *  - 덱이 완전히 비었으면 강제 quit.
 *  - 손패 카드 수 ≤ {@link QUIT_HAND_THRESHOLD} AND 손패 점수 < {@link QUIT_SCORE_THRESHOLD}
 *    일 때만 {@link QUIT_PROBABILITY} 확률로 quit.
 *  - 그 외에는 draw.
 *
 * 부스 우호: 손패가 큰 NPC는 절대 quit 안 함 → 카드 쌓임 → NPC 점수 ↑ →
 * 손님 등수에서 유리. 점수가 5점 이상인 NPC도 quit 안 함 → 큰 손실 굳히기 방지.
 *
 * 혼자 남은 NPC는 draw 불가 → null 반환 (호출자가 라운드 종료 처리).
 */
export function decideNpcMove(
  npc: Player,
  state: GameState,
): NpcDecision | null {
  if (npc.quitted) return null;

  const playable = npc.hand
    .map((c, i) => ({ c, i }))
    .filter((x) => canPlay(x.c, state.top));

  if (playable.length > 0) {
    playable.sort((a, b) => b.c.points - a.c.points);
    const best = playable[0]!;
    return { type: "play", handIdx: best.i, card: best.c };
  }

  const others = state.players.filter((p) => p.name !== npc.name && !p.quitted);
  if (others.length === 0) return null;

  if (state.deck.length === 0) return { type: "quit" };

  const score = calculateScore(npc.hand);
  if (
    npc.hand.length <= QUIT_HAND_THRESHOLD &&
    score < QUIT_SCORE_THRESHOLD &&
    Math.random() < QUIT_PROBABILITY
  ) {
    return { type: "quit" };
  }

  return { type: "draw" };
}
