# Changelog

본 프로젝트의 모든 주목할 만한 변경 사항은 이 파일에 기록됩니다.
[Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 형식을 따르며, [Semantic Versioning](https://semver.org/lang/ko/)을 채택합니다.

## [Unreleased]

### Added (2026-05-03 — PvP 모드, ADR-0004)
- PvP 라우트 `/game/pvp/` — 사람 2 + NPC 2 (HYLION 제외, 달토/페포 2명).
- 통신: Firebase Realtime Database (Spark 무료 한도 내). `firebase` 패키지 추가.
- 매칭: 4자리 방 코드 (32자 알파벳, 0/O/1/I 제외). `runTransaction`으로 코드/슬롯 점유.
- 호스트 권한: NPC 의사결정 + 액션 큐 consume + state 단일 출처. 호스트 disconnect → abort.
- 가시성: 자기 손패만 앞면, 상대 사람 + NPC 2 모두 뒷면.
- 사이드바 토글 + 뽑기/그만두기 버튼 보드 외부 분리 (`.pvp-sidebar.collapsed`, `.pvp-action-bar`).
- 결과 화면 + 운영진 "다음 게임" 버튼 (방 정리 → 양쪽 lobby 복귀).
- presence onDisconnect + 30초 grace abort.
- 신규 파일: `src/lib/pvp/{rtdb,roomCode,schema,engine}.ts`, `src/lib/store/pvpStore.ts`, `src/components/game/pvp/{PvpScreen,PvpLobby,PvpWaitingRoom,PvpBoard,PvpResultScreen}.tsx`, `src/lib/game/scoring.ts`, `database.rules.json`, `.env.local.example`, `docs/adr/0004-pvp-rtdb.md`.
- 단위 테스트: `src/lib/game/__tests__/pvpEngine.test.ts`.
- 랜딩 마지막 슬라이드에 "PvP 대전" 진입 버튼.

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

### Changed (2026-04-30 — 4인 한 판 전환, ADR-0003)
- 게임 구조: 1대1 두 라운드 → **4인 한 판** (손님 + HYLION/펩오/네이버웨일).
- 핸드 5 → 4, `TOTAL_ROUNDS = 1`로 고정.
- 판정: 등수 기반 — 손님보다 점수 낮은 NPC 수+1 = 손님 등수. 동점은 손님 위.
- 상품: 1등 키캡+인형 / 2·3등 택1 / 4등 응원품. `PlayerSummary.prize`에 `"cheer"` 추가.
- `RoundHistoryEntry`에 `playerPlace` 추가, `RoundScore`에 `place/isPlayer/quitted` 추가. `outcome/wasTie/opponentName`는 폐기.
- `RoundResult.tsx` 제거 (1라운드라 미사용).
- 운영진 멘트 폐기 ("R1 워밍업/R2 진짜 승부" → "다 같은 NPC, 4명 게임").

### Changed (2026-04-30 — NPC 박스 핸드 정렬 + 부착 말풍선)
- NPC 박스를 자기 핸드 측면 상단으로 통일: HYLION → **위 가운데** (top), 펩오 → **좌상** (top-left), 네이버웨일 → **우상** (top-right). 박스↔핸드 짝짓기 명확.
- 헤더 칩(`.table-header`) 제거 — 위쪽 라인을 박스 3개에 양보. 1라운드 전용이라 정보 가치 적음.
- 액션 말풍선을 화면 하단 통합 → **각 박스에 부착** (`.action-bubble-attached`). NPC 박스는 박스 아래(꼬리 위), 손님 박스는 박스 위(꼬리 아래) `.above`. 누가 무엇을 했는지 즉시 매칭.
- 카드 뒷면(`game-card.back`) 테두리: 진한 파랑 1.5px → **흰색 4~5px 굵은 테두리** (트럼프 카드 톤). + 외곽 1px 블랙 그림자로 나무 배경 위 식별성 ↑.

### Changed (2026-04-30 — 4코너 박스 미세 조정, Playwright 검증)
- HYLION 박스: 우중앙 → **우상 코너** (`right-4 top-4`). 네이버웨일 핸드(우중앙)와 가로 충돌 회피.
- 손님 박스: `left-[16rem]` → **`left-[6rem]`** (좌하 코너에서 살짝 우측). 손님 핸드(가운데 부채꼴)와 가로 겹침 회피.
- 액션 패널: 우하 → **좌하 손님 박스 우측** (`bottom: 1rem; left: 19rem`). 손님 영역 안에 모아 클릭 직관성 강화. 네이버웨일 박스(우하 코너)와의 겹침도 자동 해소.
- 1366×768 부스 PC + 1920×1080 두 viewport에서 Playwright 캡처로 검증 (`scripts/capture.mjs`).

### Added (2026-04-30 — 보드 룩 UI)
- top-down 나무 테이블 배경 (`globals.css` `.wood-table`).
- 4 측면 좌석 — 위/좌/우 NPC, 아래 손님. 좌·우 NPC 핸드는 `transform: rotate(±90°)`.
- 부채꼴 핸드 (`.fan-wrap.player/.npc`) — 회전축 카드 밑변/윗변 중앙.
- 카드 뒷면 PNG (`public/card-back.png`, 네이버 웨일 로고).
- 카드 디자인 정리: 좌상 + 우하 작은 번호, 이름 텍스트 제거.
- Framer Motion 애니메이션:
  - 바닥 카드 펑 등장 (스프링).
  - 핸드 카드 mount/unmount (위/아래에서 슬라이드).
  - 액션 플로팅 토스트 — 누가 무엇을 냈는지 화면 중앙에 큼직하게 ("HYLION: 4 냄!").
