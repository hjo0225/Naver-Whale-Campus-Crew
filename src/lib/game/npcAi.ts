import type { NpcDifficulty } from "./data";
import { canPlay, calculateScore } from "./rules";
import type { Card, GameState, Player } from "./types";

export type NpcDecision =
  | { type: "play"; handIdx: number; card: Card }
  | { type: "draw" }
  | { type: "quit" };

/**
 * 난이도별 NPC 의사결정.
 *
 * normal (R2 네이버웨일):
 *  - 낼 수 있는 카드가 있으면 가장 점수가 큰 카드부터 던진다 (라마 우선 폐기).
 *  - 못 내고 라마 보유 + 손 ≥3 → quit / 점수 ≥6 → quit / 덱이 비었음 → quit / else draw.
 *
 * easy (R1 HYLION):
 *  - 낼 수 있는 카드가 있을 때 30% 확률로 random playable (best 대신 실수).
 *  - quit 임계 완화: 라마 + 손 ≥4, 점수 ≥9.
 *  - 그 외엔 normal과 동일.
 *
 * 혼자 남은 NPC는 draw 불가 → null 반환 (호출자가 라운드 종료 처리).
 */
export function decideNpcMove(
  npc: Player,
  state: GameState,
  difficulty: NpcDifficulty = "normal"
): NpcDecision | null {
  if (npc.quitted) return null;

  const playable = npc.hand
    .map((c, i) => ({ c, i }))
    .filter((x) => canPlay(x.c, state.top));

  if (playable.length > 0) {
    if (difficulty === "easy" && Math.random() < 0.3) {
      // 가끔 실수: random playable. 손님이 R1을 따낼 확률 ↑
      const pick = playable[Math.floor(Math.random() * playable.length)]!;
      return { type: "play", handIdx: pick.i, card: pick.c };
    }
    playable.sort((a, b) => b.c.points - a.c.points);
    const best = playable[0]!;
    return { type: "play", handIdx: best.i, card: best.c };
  }

  const activeCount = state.players.filter((p) => !p.quitted).length;
  if (activeCount === 1) return null;

  const score = calculateScore(npc.hand);
  const hasLlama = npc.hand.some((c) => c.value === "LLAMA");

  const llamaHandThreshold = difficulty === "easy" ? 4 : 3;
  const scoreThreshold = difficulty === "easy" ? 9 : 6;

  const shouldQuit =
    (hasLlama && npc.hand.length >= llamaHandThreshold) ||
    score >= scoreThreshold ||
    state.deck.length === 0;

  return shouldQuit ? { type: "quit" } : { type: "draw" };
}
