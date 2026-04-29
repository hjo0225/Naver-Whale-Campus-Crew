import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decideNpcMove } from "../npcAi";
import { CARD_TYPES } from "../data";
import type { Card, GameState, Player } from "../types";

const make = (i: number, uid = 0): Card => ({ ...CARD_TYPES[i]!, uid });

function buildState(overrides: Partial<GameState> = {}): GameState {
  const player: Player = {
    name: "손님",
    hand: [],
    quitted: false,
    isPlayer: true,
    lastAction: null,
    char: null,
  };
  const npc: Player = {
    name: "TEST_NPC",
    hand: [],
    quitted: false,
    isPlayer: false,
    lastAction: null,
    char: "byul_e",
  };
  return {
    players: [player, npc],
    deck: [make(0), make(0, 1), make(0, 2)],
    top: make(2), // 캐릭3 (3점)
    currentTurn: 1,
    phase: "playing",
    round: 1,
    totalRounds: 2,
    totalScores: { 손님: 0, TEST_NPC: 0 },
    roundHistory: [],
    ...overrides,
  };
}

describe("decideNpcMove (normal)", () => {
  it("낼 수 있으면 가장 점수 큰 카드부터 던진다", () => {
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3), make(2, 1)] };
    const state = buildState({ players: [buildState().players[0]!, npc] });
    const decision = decideNpcMove(npc, state, "normal");
    expect(decision?.type).toBe("play");
    if (decision?.type === "play") {
      expect(decision.card.points).toBe(4); // 캐릭4 우선
    }
  });

  it("못 내면 점수 ≥6일 때 quit", () => {
    // 캐릭3 + 캐릭4 = 7점 (top=캐릭1, +1 안 됨)
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3)] };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(0) });
    expect(decideNpcMove(npc, state, "normal")?.type).toBe("quit");
  });

  it("점수 <6이고 낼 수 없으면 draw", () => {
    // 손에 캐릭1 (1점, top=캐릭3 못 냄)
    const npc = { ...buildState().players[1]!, hand: [make(0)] };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(2) });
    expect(decideNpcMove(npc, state, "normal")?.type).toBe("draw");
  });

  it("덱이 비었고 못 내면 quit", () => {
    const npc = { ...buildState().players[1]!, hand: [make(0)] };
    const state = buildState({
      players: [buildState().players[0]!, npc],
      top: make(2),
      deck: [],
    });
    expect(decideNpcMove(npc, state, "normal")?.type).toBe("quit");
  });

  it("혼자 남으면 (활성 1명) null 반환", () => {
    const player = { ...buildState().players[0]!, quitted: true };
    const npc = { ...buildState().players[1]!, hand: [make(0)] };
    const state = buildState({ players: [player, npc], top: make(2) });
    expect(decideNpcMove(npc, state, "normal")).toBeNull();
  });
});

describe("decideNpcMove (easy)", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random");
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("30% 미만 실수 분기 → random playable", () => {
    (Math.random as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(0.1).mockReturnValueOnce(0);
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3), make(2, 1)] };
    const state = buildState({ players: [buildState().players[0]!, npc] });
    const decision = decideNpcMove(npc, state, "easy");
    expect(decision?.type).toBe("play");
    // random=0 → playable[0] = 캐릭3 (idx 0)
    if (decision?.type === "play") expect(decision.card.value).toBe(3);
  });

  it("30% 이상이면 정석 (큰 점수부터)", () => {
    (Math.random as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(0.9);
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3)] };
    const state = buildState({ players: [buildState().players[0]!, npc] });
    const decision = decideNpcMove(npc, state, "easy");
    if (decision?.type === "play") expect(decision.card.points).toBe(4);
  });

  it("quit 임계 완화: 7점은 easy에선 draw / normal에선 quit, 9점은 둘 다 quit", () => {
    const handMid = [make(2), make(3)]; // 캐릭3+캐릭4 = 7점, top=캐릭1과 매칭 X
    const handHigh = [make(3), make(4)]; // 캐릭4+캐릭5 = 9점
    const stateNoPlay = buildState({ top: make(0) });

    const npcMid = { ...stateNoPlay.players[1]!, hand: handMid };
    const npcHigh = { ...stateNoPlay.players[1]!, hand: handHigh };

    expect(decideNpcMove(npcMid, stateNoPlay, "easy")?.type).toBe("draw");
    expect(decideNpcMove(npcMid, stateNoPlay, "normal")?.type).toBe("quit");
    expect(decideNpcMove(npcHigh, stateNoPlay, "easy")?.type).toBe("quit");
  });
});
