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
 * 라운드별로 상대 NPC가 다르므로 매 라운드마다 players를 재구성한다.
 * players[0] = 손님, players[1] = 그 라운드 상대.
 */
function buildPlayersForRound(round: number): Player[] {
  const opp = CONFIG.opponents[round - 1];
  if (!opp) throw new Error(`Round ${round} has no opponent in CONFIG.opponents`);
  return [makePlayer("손님", true, null), makePlayer(opp.name, false, opp.char)];
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

/** 부스 분위기 위해 동점도 손님 승. wasTie 플래그로 UI에선 동점이었음을 노출. */
function judgeRound(
  playerScore: number,
  opponentScore: number
): { outcome: RoundHistoryEntry["outcome"]; wasTie: boolean } {
  if (playerScore === opponentScore) return { outcome: "win", wasTie: true };
  return { outcome: playerScore < opponentScore ? "win" : "lose", wasTie: false };
}

function summarize(history: readonly RoundHistoryEntry[]): PlayerSummary {
  const wins = history.filter((h) => h.outcome === "win").length;
  return {
    wins,
    totalRounds: history.length,
    prize: wins === history.length ? "both" : "one",
  };
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
    const s = get().state;
    if (!s) return;
    const player = s.players[0]!;
    const opponent = s.players[1]!;
    const playerScore = player.hand.length === 0 ? 0 : calculateScore(player.hand);
    const opponentScore = opponent.hand.length === 0 ? 0 : calculateScore(opponent.hand);
    const { outcome, wasTie } = judgeRound(playerScore, opponentScore);

    const totalScores = {
      ...s.totalScores,
      [player.name]: (s.totalScores[player.name] ?? 0) + playerScore,
      [opponent.name]: (s.totalScores[opponent.name] ?? 0) + opponentScore,
    };

    const entry: RoundHistoryEntry = {
      round: s.round,
      opponentName: opponent.name,
      outcome,
      wasTie,
      scores: [
        { name: player.name, score: playerScore, hand: [...player.hand] },
        { name: opponent.name, score: opponentScore, hand: [...opponent.hand] },
      ],
    };
    const nextHistory = [...s.roundHistory, entry];

    const baseNext: GameState = {
      ...s,
      phase: "roundEnded",
      totalScores,
      roundHistory: nextHistory,
    };

    if (s.round >= s.totalRounds) {
      set({
        state: { ...baseNext, phase: "finished" },
        summary: summarize(nextHistory),
      });
    } else {
      set({ state: baseNext });
    }
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

    const opp = CONFIG.opponents[s.round - 1];
    const decision = decideNpcMove(npc, s, opp?.difficulty ?? "normal");
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
      const players = buildPlayersForRound(1);
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
        get().playerQuit();
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
      const newPlayers = s.players.map((p, i) =>
        i === 0 ? { ...p, quitted: true, lastAction: { type: "quit" as const } } : p
      );
      set({ state: { ...s, players: newPlayers } });
      advanceTurn();
    },

    goNextRound: () => {
      const s = get().state;
      if (!s) return;
      if (s.round >= s.totalRounds) return;
      const nextRoundNum = s.round + 1;
      const newPlayers = buildPlayersForRound(nextRoundNum);
      // 누적 점수 키에 새 NPC 이름 추가
      const totalScores = { ...s.totalScores };
      for (const p of newPlayers) {
        if (!(p.name in totalScores)) totalScores[p.name] = 0;
      }
      const seedState: GameState = {
        ...s,
        round: nextRoundNum,
        players: newPlayers,
        totalScores,
      };
      set({ state: dealNewRound(seedState) });
    },

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
