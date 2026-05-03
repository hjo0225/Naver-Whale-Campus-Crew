import { describe, expect, it } from "vitest";

import {
  apply,
  applyNpcStep,
  buildInitialState,
  canPlayerQuit,
  isMyTurn,
} from "@/lib/pvp/engine";
import type { ActionEnvelope } from "@/lib/pvp/schema";

const seedConfig = {
  hostName: "P1",
  guestName: "P2",
  hostUid: "uid-host",
  guestUid: "uid-guest",
};

function envelope(
  type: "play" | "draw" | "quit",
  seat: number,
  by: string,
  payload?: { handIdx?: number }
): ActionEnvelope {
  return {
    by,
    type,
    payload,
    ts: Date.now(),
    seat,
  };
}

describe("pvp engine", () => {
  it("buildInitialState — 4 players (host, guest, 2 NPCs), 4-card hands", () => {
    const s = buildInitialState(seedConfig);
    expect(s.players).toHaveLength(4);
    expect(s.players[0]).toMatchObject({ seat: 0, isPlayer: true, name: "P1" });
    expect(s.players[1]).toMatchObject({ seat: 1, isPlayer: true, name: "P2" });
    expect(s.players[2]?.isPlayer).toBe(false);
    expect(s.players[3]?.isPlayer).toBe(false);
    s.players.forEach((p) => expect(p.hand.length).toBe(4));
    expect(s.top).not.toBeNull();
    expect(s.currentTurn).toBe(0);
    expect(s.phase).toBe("playing");
  });

  it("isMyTurn / canPlayerDraw / canPlayerQuit — 첫 턴 손님 강제 플레이", () => {
    const s = buildInitialState(seedConfig);
    expect(isMyTurn(s, 0)).toBe(true);
    expect(isMyTurn(s, 1)).toBe(false);
    // 첫 턴 + 호스트(사람) → quit 불가
    expect(canPlayerQuit(s, 0)).toBe(false);
  });

  it("apply 거부 — 자기 턴 아니면 무시", () => {
    const s = buildInitialState(seedConfig);
    const before = s.version;
    const next = apply(s, envelope("draw", 1, "uid-guest"), 1);
    expect(next.version).toBe(before);
    expect(next).toBe(s);
  });

  it("apply play — 같은 액션 시퀀스 → 같은 후속 state (결정성)", () => {
    // deck 뽑기는 random이 들어가지 않으나, shuffle 자체가 random.
    // 동일 시드에서 buildInitialState를 두 번 호출하면 결과 다름. 그래서 이 테스트는
    // apply 자체의 결정성만 검증: 같은 입력 state에서 같은 액션 → 같은 출력 state.
    const s = buildInitialState(seedConfig);
    // playable card 찾기
    if (s.players[0]!.hand.length === 0) return;
    const a = envelope("play", 0, "uid-host", { handIdx: 0 });
    const r1 = apply(s, a, 0);
    const r2 = apply(s, a, 0);
    expect(r1).toEqual(r2);
  });

  it("applyNpcStep — NPC 턴이 아니면 state 그대로", () => {
    const s = buildInitialState(seedConfig);
    expect(s.currentTurn).toBe(0); // 사람 턴
    const next = applyNpcStep(s);
    expect(next).toBe(s);
  });

  it("apply quit — 사람이 quit하면 turn이 다음으로 진행", () => {
    let s = buildInitialState(seedConfig);
    // 첫 턴 우회: 강제로 lastAction 채워 첫 턴 false 만들기
    s = {
      ...s,
      players: s.players.map((p, i) =>
        i === 0
          ? { ...p, lastAction: { type: "draw" as const } }
          : p
      ),
    };
    const next = apply(s, envelope("quit", 0, "uid-host"), 0);
    expect(next.players[0]?.quitted).toBe(true);
    expect(next.currentTurn).not.toBe(0);
  });
});
