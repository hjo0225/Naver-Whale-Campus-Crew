# ADR-0003: 1대1 두 라운드 → 4인 한 판 구조 전환

- **Status**: Accepted
- **Date**: 2026-04-30
- **Deciders**: 캠퍼스크루 팀
- **Supersedes**: 게임 룰의 라운드/판정/상품 매핑 부분 (ADR 자체는 갱신 없음, `game-rules.md`의 5·6·8절 갱신)

## Context

부스 보드 룩 UI(top-down 나무 테이블, 4코너 플레이어 박스)를 도입하면서 1대1 게임의 4코너 중 2코너가 비는 어색함이 발생. 또한 NPC 1명만 등장해 웨일프렌즈 마스코트 노출 효과가 제한됨.

## Decision

게임을 **4인 한 판** 구조로 변경:

- 한 판 = 손님 1 + NPC 3 (HYLION, 펩오, 네이버웨일).
- 라운드는 1라운드만 (`totalRounds = 1`).
- 시작 핸드: 5장 → **4장** (4명 분배 후 덱 잔여 ≥ 19장 확보).
- 판정: **등수 기반**. 손님보다 엄격히 점수 낮은 NPC 수 + 1 = 손님 등수.
- **동점은 손님이 더 높은 등수** (부스 우호 정책 유지).
- 상품: 1등 키캡+인형 / 2·3등 택1 / 4등(꼴등) 응원품.
- 카드 룰(`canPlay`, `calculateScore`), NPC AI 휴리스틱(`decideNpcMove`)은 불변. 다인전에 그대로 동작.

## Consequences

- UI의 4코너가 모두 채워지고 마스코트 3종이 한 판에 동시 노출.
- 부스 1회 사이클이 단순화 (라운드 사이 RoundResult 단계 사라짐).
- `RoundResult.tsx`는 죽은 코드 → 제거.
- `PlayerSummary` 형이 `wins/totalRounds` → `place/totalPlayers/prize`로 바뀜. `RoundHistoryEntry`도 등수 정보 포함.
- 부스 우호도 (1·2·3등 비율 ≥ 75%) 시뮬레이션 검증은 D-day 전 별도로 돌려야 함 (`simulation.test.ts` 갱신 필요).
- 운영진 멘트는 "다 같은 NPC, 그냥 4명 게임"으로 통일. R1/R2 워밍업 멘트는 폐기.
