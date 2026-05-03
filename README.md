# 네이버 웨일 캠퍼스크루 부스 게임

한양대 축제 부스에서 운영할 네이버 웨일 홍보용 카드게임 웹앱.
방문자 흐름: QR 스캔 → 추천인 코드 등록 → 부스 PC에서 NPC 3명과 1판 카드게임 → 등수에 따라 상품 수령.

**Live**: <https://naver-whale-campus-crew.web.app>

## 기술 스택

### Frontend

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=000000)
![TypeScript](https://img.shields.io/badge/TypeScript_5.7_strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand_5-443E38?style=for-the-badge&logo=react&logoColor=white)

### Infra & Tooling

![Firebase](https://img.shields.io/badge/Firebase_Hosting_+_RTDB-FFCA28?style=for-the-badge&logo=firebase&logoColor=000000)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm_9.14-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Node.js](https://img.shields.io/badge/Node_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

### Testing

![Vitest](https://img.shields.io/badge/Vitest_2-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

- **렌더링**: Next.js App Router · `output: 'export'` 정적 익스포트
- **상태**: Zustand — 싱글 게임 스토어(`gameStore`) + PvP 스토어(`pvpStore`) 분리
- **PvP 통신**: Firebase Realtime Database (Spark 무료 한도) — 4자리 방 코드 매칭, 호스트 권한 모델, presence + 30s grace abort (`docs/adr/0004-pvp-rtdb.md`)
- **배포**: Firebase Hosting CDN, GitHub Actions 자동 배포 (push to `main`)
- **테스트**: Vitest — 룰 / 스코어링 / PvP 엔진 단위 테스트, Playwright는 시각 캡처용

## 시작하기

```bash
pnpm install
pnpm dev               # http://localhost:3000 (포트 사용 중이면 +1)
pnpm type-check        # TS 검증
pnpm test:run          # 룰/AI 단위 테스트
```

## 빌드 / 배포

```bash
pnpm build             # 정적 익스포트 → out/
pnpm deploy            # build + firebase deploy (project: naver-whale-campus-crew)
```

`main` 브랜치 push 시 GitHub Actions가 자동 배포 (Firebase 서비스 계정은 `FIREBASE_SERVICE_ACCOUNT` 시크릿).

## 게임 구조 — 4인 1판 (싱글)

- 손님 1명 + NPC 3명(달토, 페포, 웨일) 단판 (`docs/adr/0003-four-player-single-round.md`)
- 룰: 같은 숫자 / +1 / 5 위에 라마 / 라마 위에 1
- 종료 조건 3가지 — 누가 카드 다 냄, 모두 그만, 단독 생존자 못 냄. 종료 직전 1.8초간 사유 splash 후 결과 화면
- 등수 계산: 동점은 손님이 더 높은 등수 (부스 우호 정책)

## PvP 모드 (사람 2 + NPC 2)

- 라우트: `/game/pvp/` — 노트북 2대로 입장, 4자리 방 코드(`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, 0/O/1/I 제외)로 매칭
- 통신: Firebase Realtime Database (Spark 무료 한도). 호스트가 NPC 의사결정 + 액션 큐 consume + state 단일 출처
- 가시성: 자기 손패만 앞면, 상대 사람·NPC 2 모두 뒷면
- 안정성: presence onDisconnect + 30초 grace abort, 호스트 disconnect 시 방 abort
- 결과 후 운영진 "다음 게임" 버튼으로 양쪽 lobby 복귀
- ADR-0004 ([`docs/adr/0004-pvp-rtdb.md`](./docs/adr/0004-pvp-rtdb.md))

## 화면 레이아웃 (탑다운 보드 룩)

- 좌측 상단: 4인 정보 박스 통합 스택 (NPC 3 + 손님 1, 모두 224px 고정 폭)
- 좌측 하단: 손님 박스 + 액션 버튼 (`btn-draw` / `btn-quit`)
- 중앙: 덱 + 바닥
- 상·좌·우: NPC 핸드 + 식별 hand chip (이름 + 아바타)
- 하단 중앙: 손님 부채꼴 핸드 (playable 카드는 노란 ring 강조)

## 폴더 구조

```
src/
  app/                  # 페이지 라우트 (/, /conditions, /rules, /game, /game/pvp, /game/3d)
  components/
    game/               # GameScreen / GameBoard / Card / FinalResultScreen / EndSplash
    game/pvp/           # PvpScreen / PvpLobby / PvpWaitingRoom / PvpBoard / PvpResultScreen
    landing/            # 슬라이드쇼 / 룰 / 조건
    ui/
  lib/
    game/               # 룰·덱·NPC AI·점수·타입 (순수 로직, 단위 테스트 대상)
    pvp/                # PvP 전용: rtdb / roomCode / schema / engine
    store/
      gameStore.ts      # 싱글 게임 흐름 + NPC 턴 스케줄
      pvpStore.ts       # PvP 매칭/세션 상태
    config.ts           # 부스 운영 설정 (REFERRAL_CODE)
  styles/globals.css    # Tailwind 4 @theme + 보드 컴포넌트 클래스

firebase.json           # Firebase Hosting + RTDB 설정 (루트, CLI 표준 위치)
database.rules.json     # RTDB 보안 규칙
config/                 # 도구별 설정 (cf. package.json scripts)
  vitest.config.ts
  vitest.setup.ts
  .prettierrc.json
  .firebaserc

docs/                   # PRD · API · ARCHITECTURE · DATA_MODEL · ADR · CHANGELOG · game-rules · booth-operations
public/                 # 웨일프렌즈 PNG · qr.png · card-back.png · models/
scripts/capture.mjs     # Playwright 시각 캡처 (PORT env로 dev 서버 지정)
screenshots/            # 1366×768 / 1920×1080 캡처 (수동 검증용, 배포 제외)
asset/                  # v6 HTML 프로토타입 (배포 제외)
```

## 운영 팁

- **추천인 코드 변경**: `src/lib/config.ts` 의 `REFERRAL_CODE` 한 줄
- **NPC 이름·캐릭터·난이도**: `src/lib/game/data.ts` 의 `CONFIG.opponents`
- **카드 룰·점수**: `src/lib/game/rules.ts`, 변경 시 `docs/game-rules.md` 먼저 갱신
- **NPC 의사결정**: `src/lib/game/npcAi.ts` (난이도 easy / normal)
- **부스 운영 절차·운영진 멘트**: `docs/booth-operations.md`

## 시각 검증 (Playwright)

```bash
pnpm dev                                # 포트 확인 후
PORT=3000 node scripts/capture.mjs      # screenshots/ 갱신
```

캡처 시나리오: 1~5 base flow (두 해상도) · 6 LLAMA 와일드 · 7 그만 · 9 결과화면.
6/9는 게임 진행 우연성 의존 — 한 번에 안 잡히면 재실행.

## 더 읽을거리

- [`CLAUDE.md`](./CLAUDE.md) — 코드 작업 규칙·문서 라우팅
- [`docs/`](./docs/) — 단일 진실 공급원 (코드 변경 전에 먼저 갱신)
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) — 최근 변경 이력
