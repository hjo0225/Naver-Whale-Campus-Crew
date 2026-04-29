# Changelog

본 프로젝트의 모든 주목할 만한 변경 사항은 이 파일에 기록됩니다.
[Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 형식을 따르며, [Semantic Versioning](https://semver.org/lang/ko/)을 채택합니다.

## [Unreleased]

### Added
- Next.js 15 App Router + TypeScript 정적 익스포트 셋업
- v6 HTML의 게임 룰을 `src/lib/game/{rules,deck,npcAi}.ts`로 포팅
- Zustand 게임 스토어 (`src/lib/store/gameStore.ts`)
- 페이지 라우팅: `/`(랜딩), `/conditions/`(추천 코드 안내), `/rules/`(룰), `/game/`(2D 게임), `/game/3d/`(Phase 2 자리)
- Firebase Hosting + GitHub Actions 자동 배포
- Vitest 단위 테스트 (룰 함수)

### Notes
- `REFERRAL_CODE`는 `src/lib/config.ts`의 한 줄만 바꾸면 모든 화면에 반영
- Phase 2(3D 카드게임)는 별도 라우트에 placeholder만 존재

### Changed (재미 튜닝)
- 게임 구조를 1대1 두 라운드로 재편: R1 vs HYLION, R2 vs 네이버웨일.
- 보상: 두 판 모두 승 → 키캡+인형, 그 외 → 1개 택1.
- NPC 난이도 곡선 도입 (easy / normal). HYLION은 30% 실수 + quit 임계 완화. UI/문서에 노출 안 함.
- 무승부 = 손님 승 처리 (`wasTie` 플래그로 동점이었음만 표시).
- 첫 턴 강제 플레이: 손님 라운드 첫 턴엔 그만하기/뽑기 잠금 (낼 카드 없을 때만 뽑기).
- 결과 화면 메시지 임팩트화 ("HYLION 격파!", "완전 정복!", "한 판은 잡았다!" 등).
