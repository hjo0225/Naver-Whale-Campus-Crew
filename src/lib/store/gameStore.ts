"use client";

import { create } from "zustand";
import { CONFIG, TOTAL_ROUNDS } from "@/lib/game/data";
import { createDeck, shuffle } from "@/lib/game/deck";
import { decideNpcMove } from "@/lib/game/npcAi";
import { canPlay, calculateScore } from "@/lib/game/rules";
import type {
  Card,
  GameState,
  Player,
  PlayerSummary,
  RoundHistoryEntry,
} from "@/lib/game/types";

export interface GameStore {
  state: GameState | null;
  toast: string | null;
  /** 게임 종료 시점에만 채워짐 — 손님의 누적 결과 (상품 결정용) */
  summary: PlayerSummary | null;

  startGame: () => void;
  playerPlayCard: (handIdx: number) => void;
  playerDraw: () => void;
  playerQuit: () => void;
  goNextRound: () => void;
  reset: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

function makePlayer(name: string, isPlayer: boolean, char: Player["char"]): Player {
  return { name, hand: [], quitted: false, isPlayer, lastAction: null, char };
}

/**
 * 4인 한 판 — players[0] = 손님, players[1..N] = NPC.
 * NPC 순서는 CONFIG.opponents 그대로 (UI에서 좌·상·우 코너 매핑).
 */
function buildPlayers(): Player[] {
  return [
    makePlayer("손님", true, null),
    ...CONFIG.opponents.map((opp) => makePlayer(opp.name, false, opp.char)),
  ];
}

function dealNewRound(state: GameState): GameState {
  const deck = shuffle(createDeck());
  const players = state.players.map((p) => ({
    ...p,
    hand: [] as Card[],
    quitted: false,
    lastAction: null,
  }));
  for (let i = 0; i < CONFIG.handSize; i++) {
    for (const p of players) {
      const c = deck.pop();
      if (c) p.hand.push(c);
    }
  }
  const top = deck.pop() ?? null;
  return {
    ...state,
    players,
    deck,
    top,
    currentTurn: 0,
    phase: "playing",
  };
}

/**
 * 4인전 등수 계산. 동점은 손님이 더 높은 등수 (부스 우호).
 * 손님보다 엄격히 점수 낮은 사람 수 + 1 = 손님 등수.
 * NPC끼리는 단순 정렬.
 */
function assignPlaces(
  rows: { name: string; isPlayer: boolean; score: number }[]
): Map<string, number> {
  const player = rows.find((r) => r.isPlayer);
  const playerScore = player?.score ?? 0;
  // 손님 먼저 등수 매김 (동점 시 손님이 위)
  const playerPlace = rows.filter((r) => !r.isPlayer && r.score < playerScore).length + 1;

  // NPC 등수: 손님 등수를 비워두고 NPC끼리 점수 오름차순으로 배치
  const npcs = rows
    .filter((r) => !r.isPlayer)
    .map((r) => ({ ...r }))
    .sort((a, b) => a.score - b.score);

  const places = new Map<string, number>();
  if (player) places.set(player.name, playerPlace);

  let cur = 1;
  for (const npc of npcs) {
    if (cur === playerPlace) cur++;
    places.set(npc.name, cur);
    cur++;
  }
  return places;
}

function summarize(history: readonly RoundHistoryEntry[]): PlayerSummary {
  const last = history[history.length - 1];
  const totalPlayers = last?.scores.length ?? 4;
  const place = last?.playerPlace ?? totalPlayers;
  let prize: PlayerSummary["prize"];
  if (place === 1) prize = "both";
  else if (place === totalPlayers) prize = "cheer";
  else prize = "one";
  return { place, totalPlayers, prize };
}

/** 손님 첫 턴인지 판단 — 양쪽 모두 lastAction이 null이고 phase=playing. */
export function isPlayerFirstTurn(state: GameState | null): boolean {
  if (!state || state.phase !== "playing" || state.currentTurn !== 0) return false;
  return state.players.every((p) => p.lastAction === null);
}

export const useGameStore = create<GameStore>((set, get) => {
  let npcTimer: ReturnType<typeof setTimeout> | null = null;

  function clearNpcTimer() {
    if (npcTimer) {
      clearTimeout(npcTimer);
      npcTimer = null;
    }
  }

  function scheduleNpcTurn() {
    const s = get().state;
    if (!s || s.phase !== "playing") return;
    const cur = s.players[s.currentTurn];
    if (!cur || cur.isPlayer || cur.quitted) return;
    clearNpcTimer();
    npcTimer = setTimeout(() => runNpcTurn(), CONFIG.npcThinkDelay);
  }

  function checkRoundEnd(s: GameState): { end: boolean; toast?: string } {
    const someoneEmpty = s.players.some((p) => p.hand.length === 0 && !p.quitted);
    if (someoneEmpty) return { end: true };
    const active = s.players.filter((p) => !p.quitted);
    if (active.length === 0) return { end: true };
    if (active.length === 1) {
      const last = active[0]!;
      const canPlayAny = last.hand.some((c) => canPlay(c, s.top));
      if (!canPlayAny) {
        return { end: true, toast: "낼 수 있는 카드가 없어 라운드가 종료됩니다" };
      }
    }
    return { end: false };
  }

  function endRound() {
    clearNpcTimer();
    const s = get().state;
    if (!s) return;

    const rows = s.players.map((p) => ({
      name: p.name,
      isPlayer: p.isPlayer,
      score: p.hand.length === 0 ? 0 : calculateScore(p.hand),
      hand: [...p.hand],
      quitted: p.quitted,
    }));

    const places = assignPlaces(rows);
    const scores = rows.map((r) => ({
      name: r.name,
      isPlayer: r.isPlayer,
      score: r.score,
      hand: r.hand,
      place: places.get(r.name) ?? rows.length,
      quitted: r.quitted,
    }));
    const playerPlace = scores.find((s) => s.isPlayer)?.place ?? rows.length;

    const totalScores = { ...s.totalScores };
    for (const r of rows) {
      totalScores[r.name] = (totalScores[r.name] ?? 0) + r.score;
    }

    const entry: RoundHistoryEntry = {
      round: s.round,
      scores,
      playerPlace,
    };
    const nextHistory = [...s.roundHistory, entry];

    // 4인 1판 — 라운드 끝 = 게임 끝.
    set({
      state: {
        ...s,
        phase: "finished",
        totalScores,
        roundHistory: nextHistory,
      },
      summary: summarize(nextHistory),
    });
  }

  function advanceTurn() {
    const s = get().state;
    if (!s) return;
    const check = checkRoundEnd(s);
    if (check.toast) get().showToast(check.toast);
    if (check.end) {
      endRound();
      return;
    }
    let next = (s.currentTurn + 1) % s.players.length;
    let safety = 0;
    while (s.players[next]?.quitted && safety < s.players.length * 2) {
      next = (next + 1) % s.players.length;
      safety++;
    }
    set({ state: { ...s, currentTurn: next } });
    scheduleNpcTurn();
  }

  function runNpcTurn() {
    const s = get().state;
    if (!s || s.phase !== "playing") return;
    const idx = s.currentTurn;
    const npc = s.players[idx];
    if (!npc || npc.isPlayer || npc.quitted) {
      advanceTurn();
      return;
    }

    const decision = decideNpcMove(npc, s);
    if (!decision) {
      endRound();
      return;
    }

    const newPlayers = s.players.map((p, i) => (i === idx ? { ...p, hand: [...p.hand] } : p));
    const target = newPlayers[idx]!;

    if (decision.type === "play") {
      target.hand.splice(decision.handIdx, 1);
      target.lastAction = { type: "play", card: decision.card };
      const next: GameState = { ...s, players: newPlayers, top: decision.card };
      set({ state: next });
      if (target.hand.length === 0) {
        endRound();
        return;
      }
      advanceTurn();
      return;
    }

    if (decision.type === "draw") {
      const newDeck = [...s.deck];
      const drawn = newDeck.pop();
      if (drawn) target.hand.push(drawn);
      target.lastAction = { type: "draw" };
      set({ state: { ...s, players: newPlayers, deck: newDeck } });
      advanceTurn();
      return;
    }

    target.quitted = true;
    target.lastAction = { type: "quit" };
    set({ state: { ...s, players: newPlayers } });
    advanceTurn();
  }

  return {
    state: null,
    toast: null,
    summary: null,

    startGame: () => {
      clearNpcTimer();
      const players = buildPlayers();
      const totalScores: Record<string, number> = {};
      players.forEach((p) => {
        totalScores[p.name] = 0;
      });
      const base: GameState = {
        players,
        deck: [],
        top: null,
        currentTurn: 0,
        phase: "playing",
        round: 1,
        totalRounds: TOTAL_ROUNDS,
        totalScores,
        roundHistory: [],
      };
      set({ state: dealNewRound(base), summary: null });
    },

    playerPlayCard: (handIdx) => {
      const s = get().state;
      if (!s || s.phase !== "playing" || s.currentTurn !== 0) return;
      const player = s.players[0];
      if (!player) return;
      const card = player.hand[handIdx];
      if (!card || !canPlay(card, s.top)) return;

      const newPlayers = s.players.map((p, i) => (i === 0 ? { ...p, hand: [...p.hand] } : p));
      const me = newPlayers[0]!;
      me.hand.splice(handIdx, 1);
      me.lastAction = { type: "play", card };
      set({ state: { ...s, players: newPlayers, top: card } });
      if (me.hand.length === 0) {
        endRound();
        return;
      }
      advanceTurn();
    },

    playerDraw: () => {
      const s = get().state;
      if (!s || s.phase !== "playing" || s.currentTurn !== 0) return;
      const activeCount = s.players.filter((p) => !p.quitted).length;
      if (activeCount === 1) return;
      if (s.deck.length === 0) {
        // 덱이 비면 뽑기 자체 무시 — 의도하지 않은 자동 quit 방지.
        // UI 측 drawDisabled가 "덱 비었음" 라벨로 안내.
        get().showToast("덱이 비어 카드를 뽑을 수 없어요");
        return;
      }
      const newPlayers = s.players.map((p, i) => (i === 0 ? { ...p, hand: [...p.hand] } : p));
      const me = newPlayers[0]!;
      const newDeck = [...s.deck];
      const drawn = newDeck.pop();
      if (drawn) me.hand.push(drawn);
      me.lastAction = { type: "draw" };
      set({ state: { ...s, players: newPlayers, deck: newDeck } });
      advanceTurn();
    },

    playerQuit: () => {
      const s = get().state;
      if (!s || s.phase !== "playing" || s.currentTurn !== 0) return;
      // 첫 턴 강제 — 손님이 첫 턴에 그만하기 못 함 (부스 우호 룰).
      if (isPlayerFirstTurn(s)) return;
      const newPlayers = s.players.map((p, i) =>
        i === 0 ? { ...p, quitted: true, lastAction: { type: "quit" as const } } : p
      );
      set({ state: { ...s, players: newPlayers } });
      advanceTurn();
    },

    /** 4인 1판 구조에서는 호출 X. 다중 라운드 구조 복귀 시 재구현. */
    goNextRound: () => {},

    reset: () => {
      clearNpcTimer();
      set({ state: null, summary: null });
    },

    showToast: (msg) => {
      set({ toast: msg });
    },
    clearToast: () => {
      set({ toast: null });
    },
  };
});
