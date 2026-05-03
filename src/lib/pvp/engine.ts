import { CONFIG, TOTAL_ROUNDS } from "@/lib/game/data";
import { createDeck, shuffle } from "@/lib/game/deck";
import { decideNpcMove } from "@/lib/game/npcAi";
import { canPlay, calculateScore } from "@/lib/game/rules";
import { assignPlaces, summarize } from "@/lib/game/scoring";
import type { Card, RoundHistoryEntry } from "@/lib/game/types";

import type { ActionEnvelope, RoomPlayer, RoomState } from "./schema";

export interface PvpSeatConfig {
  /** 호스트 슬롯의 사람 표기명 */
  hostName: string;
  /** 게스트 슬롯의 사람 표기명 */
  guestName: string;
  hostUid: string;
  guestUid: string;
}

/**
 * 새 PvP 게임 state 생성. 호스트가 양쪽 슬롯 채워진 직후 호출.
 * 좌석 배치: seat 0=host(사람), seat 1=guest(사람), seat 2~3=NPC(opponents 앞 2개).
 */
export function buildInitialState(seat: PvpSeatConfig): RoomState {
  const opponents = CONFIG.opponents.slice(0, 2);
  const players: RoomPlayer[] = [
    {
      seat: 0,
      name: seat.hostName,
      isPlayer: true,
      uid: seat.hostUid,
      char: null,
      hand: [],
      quitted: false,
      lastAction: null,
    },
    {
      seat: 1,
      name: seat.guestName,
      isPlayer: true,
      uid: seat.guestUid,
      char: null,
      hand: [],
      quitted: false,
      lastAction: null,
    },
    ...opponents.map<RoomPlayer>((opp, i) => ({
      seat: 2 + i,
      name: opp.name,
      isPlayer: false,
      uid: null,
      char: opp.char,
      hand: [],
      quitted: false,
      lastAction: null,
    })),
  ];

  const deck = shuffle(createDeck());
  for (let i = 0; i < CONFIG.handSize; i++) {
    for (const p of players) {
      const c = deck.pop();
      if (c) p.hand.push(c);
    }
  }
  const top = deck.pop() ?? null;

  const totalScores: Record<string, number> = {};
  players.forEach((p) => {
    totalScores[p.name] = 0;
  });

  return {
    deck,
    top,
    currentTurn: 0,
    phase: "playing",
    players,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    totalScores,
    roundHistory: [],
    summary: null,
    version: 1,
  };
}

/** 현재 턴의 플레이어가 NPC인가? (호스트가 자동 진행 결정용) */
export function currentIsNpc(state: RoomState): boolean {
  const cur = state.players[state.currentTurn];
  return Boolean(cur && !cur.isPlayer && !cur.quitted);
}

/** 라운드 종료 조건 — gameStore.checkRoundEnd 와 의미적으로 동일. */
function checkRoundEnd(state: RoomState): boolean {
  const someoneEmpty = state.players.some((p) => p.hand.length === 0 && !p.quitted);
  if (someoneEmpty) return true;
  const active = state.players.filter((p) => !p.quitted);
  if (active.length === 0) return true;
  if (active.length === 1) {
    const last = active[0]!;
    return !last.hand.some((c) => canPlay(c, state.top));
  }
  return false;
}

function endGame(state: RoomState): RoomState {
  const rows = state.players.map((p) => ({
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
  const playerPlace =
    scores.find((s) => s.isPlayer)?.place ?? rows.length;

  const totalScores = { ...state.totalScores };
  for (const r of rows) {
    totalScores[r.name] = (totalScores[r.name] ?? 0) + r.score;
  }
  const entry: RoundHistoryEntry = {
    round: state.round,
    scores,
    playerPlace,
  };
  const nextHistory = [...state.roundHistory, entry];

  return {
    ...state,
    phase: "finished",
    totalScores,
    roundHistory: nextHistory,
    summary: summarize(nextHistory),
    version: state.version + 1,
  };
}

function advanceTurn(state: RoomState): RoomState {
  if (checkRoundEnd(state)) return endGame(state);
  let next = (state.currentTurn + 1) % state.players.length;
  let safety = 0;
  while (state.players[next]?.quitted && safety < state.players.length * 2) {
    next = (next + 1) % state.players.length;
    safety++;
  }
  return { ...state, currentTurn: next, version: state.version + 1 };
}

/** 첫 턴인지 (모든 플레이어의 lastAction이 null + phase=playing). */
export function isFirstTurn(state: RoomState): boolean {
  if (state.phase !== "playing") return false;
  return state.players.every((p) => p.lastAction === null);
}

/**
 * 액션을 적용해 다음 state 반환. validation 실패하면 원본 그대로 반환.
 * 호스트만 호출 (게스트는 /actions에 push만 하고, 호스트가 listen해서 여기로 흘림).
 *
 * @param actorSeat — 액션을 실행하는 좌석. 사람 액션은 envelope에서, NPC는 currentTurn에서.
 */
export function apply(
  state: RoomState,
  action: ActionEnvelope | { type: "play" | "draw" | "quit"; payload?: { handIdx?: number } },
  actorSeat?: number
): RoomState {
  if (state.phase !== "playing") return state;

  const seat =
    "seat" in action && typeof (action as ActionEnvelope).seat === "number"
      ? (action as ActionEnvelope).seat
      : actorSeat ?? state.currentTurn;

  if (seat !== state.currentTurn) return state; // 자기 턴 아님 — 무시
  const me = state.players[seat];
  if (!me || me.quitted) return state;

  const newPlayers: RoomPlayer[] = state.players.map((p, i) =>
    i === seat ? { ...p, hand: [...p.hand] } : p
  );
  const target = newPlayers[seat]!;

  if (action.type === "play") {
    const handIdx = action.payload?.handIdx ?? -1;
    const card = target.hand[handIdx];
    if (!card || !canPlay(card, state.top)) return state;
    target.hand.splice(handIdx, 1);
    target.lastAction = { type: "play", card };
    const next: RoomState = {
      ...state,
      players: newPlayers,
      top: card,
      version: state.version + 1,
    };
    if (target.hand.length === 0) return endGame(next);
    return advanceTurn(next);
  }

  if (action.type === "draw") {
    // 솔로 활성 1명 + 자기 턴 → draw 의미 없음
    const activeCount = newPlayers.filter((p) => !p.quitted).length;
    if (activeCount === 1) return state;
    if (state.deck.length === 0) return state;
    const newDeck = [...state.deck];
    const drawn = newDeck.pop();
    if (drawn) target.hand.push(drawn);
    target.lastAction = { type: "draw" };
    return advanceTurn({
      ...state,
      players: newPlayers,
      deck: newDeck,
      version: state.version + 1,
    });
  }

  // quit
  // 사람일 때는 첫 턴 강제 (부스 우호) — 솔로와 동일
  if (me.isPlayer && isFirstTurn(state)) return state;
  target.quitted = true;
  target.lastAction = { type: "quit" };
  return advanceTurn({
    ...state,
    players: newPlayers,
    version: state.version + 1,
  });
}

/** 호스트가 호출. 현재 턴이 NPC면 의사결정 후 apply. NPC가 아니면 state 그대로. */
export function applyNpcStep(state: RoomState): RoomState {
  if (state.phase !== "playing") return state;
  const cur = state.players[state.currentTurn];
  if (!cur || cur.isPlayer || cur.quitted) return state;

  // gameStore.runNpcTurn 의 GameState 형태로 변환해서 decideNpcMove에 전달.
  const decision = decideNpcMove(cur, {
    players: state.players.map((p) => ({
      name: p.name,
      hand: p.hand,
      quitted: p.quitted,
      isPlayer: p.isPlayer,
      lastAction: p.lastAction,
      char: p.char,
    })),
    deck: state.deck,
    top: state.top,
    currentTurn: state.currentTurn,
    phase: "playing",
    round: state.round,
    totalRounds: state.totalRounds,
    totalScores: state.totalScores,
    roundHistory: state.roundHistory,
  });
  if (!decision) return endGame(state);

  if (decision.type === "play") {
    return apply(
      state,
      { type: "play", payload: { handIdx: decision.handIdx } },
      state.currentTurn
    );
  }
  if (decision.type === "draw") {
    return apply(state, { type: "draw" }, state.currentTurn);
  }
  return apply(state, { type: "quit" }, state.currentTurn);
}

export function isMyTurn(state: RoomState | null, mySeat: number): boolean {
  if (!state || state.phase !== "playing") return false;
  return state.currentTurn === mySeat && !state.players[mySeat]?.quitted;
}

export function canPlayerQuit(state: RoomState | null, mySeat: number): boolean {
  if (!isMyTurn(state, mySeat)) return false;
  return !isFirstTurn(state!);
}

export function canPlayerDraw(state: RoomState | null, mySeat: number): boolean {
  if (!isMyTurn(state, mySeat)) return false;
  if (state!.deck.length === 0) return false;
  const me = state!.players[mySeat]!;
  const activeCount = state!.players.filter((p) => !p.quitted).length;
  if (activeCount === 1) return false;
  // 첫 턴 + 낼 수 있는 카드 있음 → 강제 플레이
  if (isFirstTurn(state!) && me.hand.some((c) => canPlay(c, state!.top))) return false;
  return true;
}

// (Card import는 ts-prune 경고 방지용 미사용 export)
export type { Card };
