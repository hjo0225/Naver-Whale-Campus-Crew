import { describe, expect, it } from "vitest";
import { CONFIG } from "../data";
import { createDeck, shuffle } from "../deck";
import { decideNpcMove } from "../npcAi";
import { canPlay, calculateScore } from "../rules";
import type { GameState, Player } from "../types";

/**
 * 부스 손님 승률 분포 시뮬레이터.
 *
 * 의도된 분포 (PRD / docs/game-rules.md §7):
 *  - 2승 ≈ 28%, 1승 ≈ 60%, 0승 ≈ 12%
 *
 * 무작위 시드라 매 실행 분산이 있어 기본은 `it.skip`. 튜닝할 때
 * 일시적으로 `it.skip` → `it`로 바꾸고 `pnpm test:run` 한 번 돌려보면 된다.
 *
 * NOTE: 이 시뮬레이션은 사람 플레이어를 대신해 "정석" 전략(가장 점수 큰
 * playable 카드부터 던지고, 못 내면 점수 ≥6 / 라마+손≥3에서 quit)으로
 * 흉내낸다. 실제 손님은 더 약한 의사결정을 할 가능성도 있어 분포는 가이드.
 */

function buildPlayers(round: number): Player[] {
  const opp = CONFIG.opponents[round - 1];
  if (!opp) throw new Error("no opponent");
  return [
    { name: "손님", hand: [], quitted: false, isPlayer: true, lastAction: null, char: null },
    { name: opp.name, hand: [], quitted: false, isPlayer: false, lastAction: null, char: opp.char },
  ];
}

function dealRound(round: number): GameState {
  const deck = shuffle(createDeck());
  const players = buildPlayers(round);
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
    round,
    totalRounds: CONFIG.opponents.length,
    totalScores: {},
    roundHistory: [],
  };
}

/** 손님 정석 의사결정 — NPC normal 휴리스틱과 동일. */
function decidePlayerMove(player: Player, state: GameState, isFirstTurn: boolean) {
  const playable = player.hand
    .map((c, i) => ({ c, i }))
    .filter((x) => canPlay(x.c, state.top));
  if (playable.length > 0) {
    playable.sort((a, b) => b.c.points - a.c.points);
    return { type: "play" as const, handIdx: playable[0]!.i, card: playable[0]!.c };
  }
  if (isFirstTurn) return { type: "draw" as const }; // 첫 턴엔 quit 금지
  const activeCount = state.players.filter((p) => !p.quitted).length;
  if (activeCount === 1) return null;
  const score = calculateScore(player.hand);
  const hasLlama = player.hand.some((c) => c.value === "LLAMA");
  if ((hasLlama && player.hand.length >= 3) || score >= 6 || state.deck.length === 0) {
    return { type: "quit" as const };
  }
  return { type: "draw" as const };
}

function applyDecision(
  s: GameState,
  idx: number,
  decision: ReturnType<typeof decideNpcMove>
): GameState {
  if (!decision) {
    // 라운드 종료 신호로 반환
    return { ...s, phase: "roundEnded" };
  }
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

function simulateRound(round: number): "win" | "lose" {
  const opp = CONFIG.opponents[round - 1]!;
  let s = dealRound(round);
  let safety = 0;
  while (!isRoundOver(s) && safety < 200) {
    const cur = s.players[s.currentTurn]!;
    const isFirstTurn = s.players.every((p) => p.lastAction === null) && cur.isPlayer;
    const decision = cur.isPlayer
      ? decidePlayerMove(cur, s, isFirstTurn)
      : decideNpcMove(cur, s, opp.difficulty);
    if (!decision) break;
    s = applyDecision(s, s.currentTurn, decision as ReturnType<typeof decideNpcMove>);
    if (s.players[s.currentTurn]?.hand.length === 0 && !s.players[s.currentTurn]?.quitted) break;
    let next = (s.currentTurn + 1) % s.players.length;
    let g = 0;
    while (s.players[next]?.quitted && g < 4) {
      next = (next + 1) % s.players.length;
      g++;
    }
    s = { ...s, currentTurn: next };
    safety++;
  }
  const player = s.players[0]!;
  const ai = s.players[1]!;
  const ps = player.hand.length === 0 ? 0 : calculateScore(player.hand);
  const as_ = ai.hand.length === 0 ? 0 : calculateScore(ai.hand);
  return ps <= as_ ? "win" : "lose";
}

describe.skip("부스 승률 분포 시뮬레이션", () => {
  it("1만 판 → 2승 ~28%, 1승 ~60%, 0승 ~12% 근처", () => {
    const N = 10_000;
    let twoWins = 0;
    let oneWin = 0;
    let zeroWins = 0;
    for (let i = 0; i < N; i++) {
      const r1 = simulateRound(1);
      const r2 = simulateRound(2);
      const wins = (r1 === "win" ? 1 : 0) + (r2 === "win" ? 1 : 0);
      if (wins === 2) twoWins++;
      else if (wins === 1) oneWin++;
      else zeroWins++;
    }
    const total = twoWins + oneWin + zeroWins;
    const pct = (n: number) => (n / total) * 100;
    // eslint-disable-next-line no-console
    console.log(
      `[booth distribution] 2승 ${pct(twoWins).toFixed(1)}% / 1승 ${pct(oneWin).toFixed(1)}% / 0승 ${pct(zeroWins).toFixed(1)}%`
    );
    // 헐거운 가드 — 분포가 ±10%p 이내면 OK (튜닝 시점에만 활용)
    expect(pct(twoWins)).toBeGreaterThan(15);
    expect(pct(twoWins)).toBeLessThan(45);
    expect(pct(zeroWins)).toBeLessThan(25);
  });
});
