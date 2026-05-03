import { afterEach, describe, expect, it, vi } from "vitest";
import { decideNpcMove, QUIT_PROBABILITY } from "../npcAi";
import { CARD_TYPES } from "../data";
import type { Card, GameState, Player } from "../types";

const make = (i: number, uid = 0): Card => ({ ...CARD_TYPES[i]!, uid });

function buildState(overrides: Partial<GameState> = {}): GameState {
  const player: Player = {
    name: "손님",
    hand: [make(0), make(1), make(2)],
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
    deck: Array.from({ length: 10 }, (_, i) => make(0, i)),
    top: make(2),
    currentTurn: 1,
    phase: "playing",
    round: 1,
    totalRounds: 1,
    totalScores: { 손님: 0, TEST_NPC: 0 },
    roundHistory: [],
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("decideNpcMove — 기본 동작", () => {
  it("낼 수 있으면 가장 점수 큰 카드부터 던진다", () => {
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3), make(2, 1)] };
    const state = buildState({ players: [buildState().players[0]!, npc] });
    const decision = decideNpcMove(npc, state);
    expect(decision?.type).toBe("play");
    if (decision?.type === "play") {
      expect(decision.card.points).toBe(4); // 캐릭4 우선
    }
  });

  it("덱 비었고 못 내면 무조건 quit", () => {
    const npc = { ...buildState().players[1]!, hand: [make(0)] };
    const state = buildState({
      players: [buildState().players[0]!, npc],
      top: make(2),
      deck: [],
    });
    expect(decideNpcMove(npc, state)?.type).toBe("quit");
  });

  it("혼자 남으면 (활성 1명) null 반환", () => {
    const player = { ...buildState().players[0]!, quitted: true };
    const npc = { ...buildState().players[1]!, hand: [make(0)] };
    const state = buildState({ players: [player, npc], top: make(2) });
    expect(decideNpcMove(npc, state)).toBeNull();
  });
});

describe("decideNpcMove — 손패·점수 임계 + 확률 quit", () => {
  // top=캐릭1 → 매칭은 value 1 또는 2. 손패에는 3·4·5만 두어 무조건 못 내게 둔다.
  it("손패 > 5 → 확률 무시하고 항상 draw", () => {
    // 점수 12 (3+4+5 unique)
    const npc = {
      ...buildState().players[1]!,
      hand: [make(2), make(2, 1), make(3), make(3, 1), make(4), make(4, 1)],
    };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(0) });
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(decideNpcMove(npc, state)?.type).toBe("draw");
  });

  it("손패 ≤ 5 + 점수 > 10 → draw (큰 손실 회피)", () => {
    // hand=3장, 점수 12 (3+4+5 unique)
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3), make(4)] };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(0) });
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(decideNpcMove(npc, state)?.type).toBe("draw");
  });

  it("손패 ≤ 5 + 점수 ≤ 10 + random < 임계 → quit", () => {
    // hand=2장, 점수 7 (3+4)
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3)] };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(0) });
    vi.spyOn(Math, "random").mockReturnValue(QUIT_PROBABILITY - 0.01);
    expect(decideNpcMove(npc, state)?.type).toBe("quit");
  });

  it("손패 ≤ 5 + 점수 ≤ 10 + random ≥ 임계 → draw", () => {
    const npc = { ...buildState().players[1]!, hand: [make(2), make(3)] };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(0) });
    vi.spyOn(Math, "random").mockReturnValue(QUIT_PROBABILITY);
    expect(decideNpcMove(npc, state)?.type).toBe("draw");
  });

  it("손패 = 5 (경계값) + 점수 ≤ 10 + random < 임계 → quit", () => {
    // values 3,3,4,4,4 → unique {3,4} → 점수 7
    const npc = {
      ...buildState().players[1]!,
      hand: [make(2), make(2, 1), make(3), make(3, 1), make(3, 2)],
    };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(0) });
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(decideNpcMove(npc, state)?.type).toBe("quit");
  });

  it("손패 = 6 (경계값+1) → draw", () => {
    const npc = {
      ...buildState().players[1]!,
      hand: [make(2), make(2, 1), make(3), make(3, 1), make(4), make(4, 1)],
    };
    const state = buildState({ players: [buildState().players[0]!, npc], top: make(0) });
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(decideNpcMove(npc, state)?.type).toBe("draw");
  });
});
