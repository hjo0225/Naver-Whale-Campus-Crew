import { describe, expect, it } from "vitest";
import { canPlay, calculateScore } from "../rules";
import { CARD_TYPES, LLAMA_CARD } from "../data";
import type { Card } from "../types";

const make = (i: number, uid = 0): Card => ({ ...CARD_TYPES[i]!, uid });
const llama = (uid = 0): Card => ({ ...LLAMA_CARD, uid });

describe("canPlay", () => {
  it("처음에는 아무 카드나 낼 수 있다", () => {
    expect(canPlay(make(0), null)).toBe(true);
  });

  it("같은 숫자는 낼 수 있다", () => {
    expect(canPlay(make(2), make(2, 1))).toBe(true);
  });

  it("+1은 낼 수 있다", () => {
    expect(canPlay(make(3), make(2))).toBe(true);
  });

  it("−1은 낼 수 없다", () => {
    expect(canPlay(make(1), make(2))).toBe(false);
  });

  it("5 위에는 라마를 낼 수 있다", () => {
    expect(canPlay(llama(), make(4))).toBe(true);
  });

  it("라마 위에는 1만 낼 수 있다", () => {
    expect(canPlay(make(0), llama())).toBe(true);
    expect(canPlay(make(1), llama())).toBe(false);
  });

  it("라마 위에 라마는 낼 수 있다 (같은 값)", () => {
    expect(canPlay(llama(1), llama(2))).toBe(true);
  });
});

describe("calculateScore", () => {
  it("빈 손은 0점", () => {
    expect(calculateScore([])).toBe(0);
  });

  it("일반적인 합", () => {
    expect(calculateScore([make(0), make(2)])).toBe(1 + 3);
  });

  it("같은 카드는 한 번만 카운트", () => {
    expect(calculateScore([make(3), make(3, 1), make(3, 2)])).toBe(4);
  });

  it("라마는 -8점", () => {
    expect(calculateScore([llama()])).toBe(8);
  });

  it("복합", () => {
    // 1, 4, 4(중복), 라마 = 1 + 4 + 8 = 13
    expect(calculateScore([make(0), make(3), make(3, 1), llama()])).toBe(13);
  });
});
