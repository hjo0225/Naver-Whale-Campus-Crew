import { describe, expect, it } from "vitest";
import { CONFIG } from "../data";
import { createDeck, shuffle } from "../deck";
import { decideNpcMove } from "../npcAi";
import { canPlay, calculateScore } from "../rules";
import type { GameState, Player } from "../types";

/**
 * 부스 4인 한 판 손님 등수 분포 시뮬레이터.
 *
 * 캘리브레이션 목표 (튜닝 시 변경):
 *  - P(손님 1·2·3등) ≈ 50%, P(꽝) ≈ 50%  (또는 행사 컨셉에 맞춰 조정)
 *
 * 시뮬레이션 가정:
 *  - 손님은 NPC와 동일한 휴리스틱(낼 수 있으면 가장 큰 점수 카드, 라운드 임박+점수 ≥8이면 quit)으로 둠.
 *  - 첫 턴 강제 플레이 룰 적용 (낼 수 있으면 무조건 play, 없으면 draw, quit 금지).
 *  - 동점은 손님이 위 (부스 우호 정책).
 *  - 실제 손님은 더 약하게 둘 가능성이 있어 분포는 가이드. 손님 패배 비율은 실측에선 더 높을 수 있음.
 *
 * 무작위 시드라 매 실행 분산이 있어 기본은 `describe.skip`. 캘리브레이션할 때
 * 일시적으로 `describe.skip` → `describe`로 바꾸고 `pnpm test:run` 으로 실행.
 */

function buildPlayers(): Player[] {
  return [
    { name: "손님", hand: [], quitted: false, isPlayer: true, lastAction: null, char: null },
    ...CONFIG.opponents.map((opp) => ({
      name: opp.name,
      hand: [],
      quitted: false,
      isPlayer: false,
      lastAction: null,
      char: opp.char,
    })),
  ];
}

function dealGame(): GameState {
  const deck = shuffle(createDeck());
  const players = buildPlayers();
  for (let i = 0; i < CONFIG.handSize; i++) {
    for (const p of players) {
      const c = deck.pop();
      if (c) p.hand.push(c);
    }
  }
  const top = deck.pop() ?? null;
  return {
    players,
    deck,
    top,
    currentTurn: 0,
    phase: "playing",
    round: 1,
    totalRounds: 1,
    totalScores: {},
    roundHistory: [],
  };
}

/** 손님 의사결정 — NPC 상황 인지 휴리스틱과 동일하되 첫 턴 강제 플레이 적용. */
function decidePlayerMove(player: Player, state: GameState, isFirstTurn: boolean) {
  const playable = player.hand
    .map((c, i) => ({ c, i }))
    .filter((x) => canPlay(x.c, state.top));
  if (playable.length > 0) {
    playable.sort((a, b) => b.c.points - a.c.points);
    return { type: "play" as const, handIdx: playable[0]!.i, card: playable[0]!.c };
  }
  if (isFirstTurn) return { type: "draw" as const };
  const others = state.players.filter((p) => p.name !== player.name && !p.quitted);
  if (others.length === 0) return null;
  if (state.deck.length === 0) return { type: "quit" as const };
  const score = calculateScore(player.hand);
  const minOtherHand = Math.min(...others.map((p) => p.hand.length));
  const roundEndingSoon = minOtherHand <= 1 || state.deck.length <= 3;
  if (roundEndingSoon && score >= 8) return { type: "quit" as const };
  return { type: "draw" as const };
}

function applyDecision(
  s: GameState,
  idx: number,
  decision: ReturnType<typeof decideNpcMove>,
): GameState {
  if (!decision) return { ...s, phase: "roundEnded" };
  const players = s.players.map((p, i) => (i === idx ? { ...p, hand: [...p.hand] } : p));
  const target = players[idx]!;
  if (decision.type === "play") {
    target.hand.splice(decision.handIdx, 1);
    target.lastAction = { type: "play", card: decision.card };
    return { ...s, players, top: decision.card };
  }
  if (decision.type === "draw") {
    const deck = [...s.deck];
    const drawn = deck.pop();
    if (drawn) target.hand.push(drawn);
    target.lastAction = { type: "draw" };
    return { ...s, players, deck };
  }
  target.quitted = true;
  target.lastAction = { type: "quit" };
  return { ...s, players };
}

function isRoundOver(s: GameState): boolean {
  if (s.players.some((p) => p.hand.length === 0 && !p.quitted)) return true;
  const active = s.players.filter((p) => !p.quitted);
  if (active.length === 0) return true;
  if (active.length === 1) {
    const last = active[0]!;
    if (!last.hand.some((c) => canPlay(c, s.top))) return true;
  }
  return false;
}

function simulateGame(): { place: number; playerScore: number; scores: number[] } {
  let s = dealGame();
  let safety = 0;
  while (!isRoundOver(s) && safety < 400) {
    const cur = s.players[s.currentTurn]!;
    const isFirstTurn = s.players.every((p) => p.lastAction === null) && cur.isPlayer;
    const decision = cur.isPlayer
      ? decidePlayerMove(cur, s, isFirstTurn)
      : decideNpcMove(cur, s);
    if (!decision) break;
    s = applyDecision(s, s.currentTurn, decision as ReturnType<typeof decideNpcMove>);
    if (s.players[s.currentTurn]?.hand.length === 0 && !s.players[s.currentTurn]?.quitted) break;
    let next = (s.currentTurn + 1) % s.players.length;
    let g = 0;
    while (s.players[next]?.quitted && g < s.players.length) {
      next = (next + 1) % s.players.length;
      g++;
    }
    s = { ...s, currentTurn: next };
    safety++;
  }
  const scores = s.players.map((p) => (p.hand.length === 0 ? 0 : calculateScore(p.hand)));
  const playerScore = scores[0]!;
  // 동점은 손님 위 — strictly lower NPC count + 1
  const lowerNpcCount = scores.slice(1).filter((sc) => sc < playerScore).length;
  return { place: lowerNpcCount + 1, playerScore, scores };
}

describe.skip("부스 4인 손님 등수 분포", () => {
  it("10000판 → P(1·2·3등) 측정", () => {
    const N = 10_000;
    const places = [0, 0, 0, 0];
    let totalPlayerScore = 0;
    for (let i = 0; i < N; i++) {
      const r = simulateGame();
      places[r.place - 1]!++;
      totalPlayerScore += r.playerScore;
    }
    const pct = (n: number) => (n / N) * 100;
    const top3 = pct(places[0]!) + pct(places[1]!) + pct(places[2]!);
    // eslint-disable-next-line no-console
    console.log(
      `[place dist] 1등 ${pct(places[0]!).toFixed(1)}% / 2등 ${pct(places[1]!).toFixed(1)}% / 3등 ${pct(places[2]!).toFixed(1)}% / 4등 ${pct(places[3]!).toFixed(1)}% | 1·2·3등 합 ${top3.toFixed(1)}% | 손님 평균 점수 ${(totalPlayerScore / N).toFixed(2)}`,
    );
    // 가이드 — 부스 우호: 1·2·3등 ≥ 40% 정도면 합격선
    expect(top3).toBeGreaterThan(20);
  });
});
