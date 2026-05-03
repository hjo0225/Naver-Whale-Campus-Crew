import type { PlayerSummary, RoundHistoryEntry } from "./types";

/**
 * 4인전 등수 계산. 동점은 손님이 더 높은 등수 (부스 우호).
 * 손님보다 엄격히 점수 낮은 사람 수 + 1 = 손님 등수.
 *
 * PvP에서는 사람 둘 모두 isPlayer=true. 두 사람 사이의 동점은 점수 입력 순서 기준
 * (호스트 seat 0이 위) — 시각적 일관성 + 부스 우호 정책 양쪽 모두 만족.
 */
export function assignPlaces(
  rows: { name: string; isPlayer: boolean; score: number }[]
): Map<string, number> {
  const players = rows.filter((r) => r.isPlayer);
  const npcs = rows.filter((r) => !r.isPlayer);

  const places = new Map<string, number>();

  if (players.length === 1) {
    // 솔로 모드 동작: 손님 1명 + NPC 다수.
    const player = players[0]!;
    const playerPlace = npcs.filter((r) => r.score < player.score).length + 1;
    places.set(player.name, playerPlace);

    const sortedNpcs = [...npcs].sort((a, b) => a.score - b.score);
    let cur = 1;
    for (const npc of sortedNpcs) {
      if (cur === playerPlace) cur++;
      places.set(npc.name, cur);
      cur++;
    }
    return places;
  }

  // PvP: 사람 ≥ 2. 모든 행을 점수 오름차순으로 정렬. 동점은 행 입력 순서 유지(stable sort).
  const ranked = [...rows]
    .map((r, i) => ({ ...r, _i: i }))
    .sort((a, b) => a.score - b.score || a._i - b._i);
  ranked.forEach((r, idx) => places.set(r.name, idx + 1));
  return places;
}

/** 손님(들 중 첫 번째) 등수에 따른 상품 매핑. PvP에서는 자기 자신의 등수 기준. */
export function summarize(
  history: readonly RoundHistoryEntry[],
  myName?: string
): PlayerSummary {
  const last = history[history.length - 1];
  const totalPlayers = last?.scores.length ?? 4;
  let place = last?.playerPlace ?? totalPlayers;
  if (myName && last) {
    const mine = last.scores.find((s) => s.name === myName);
    if (mine) place = mine.place;
  }
  let prize: PlayerSummary["prize"];
  if (place === 1) prize = "both";
  else if (place === totalPlayers) prize = "cheer";
  else prize = "one";
  return { place, totalPlayers, prize };
}
