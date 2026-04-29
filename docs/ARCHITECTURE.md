# Architecture

## 1. 시스템 개요

```
[방문자/운영진] ──▶ [부스 PC 브라우저]
                     │
                     ├─ Next.js 정적 익스포트 (`out/`)
                     │   ├─ /          (랜딩, 자동 슬라이드쇼)
                     │   ├─ /conditions (참가 방법 3단계)
                     │   ├─ /rules     (게임 룰 5페이지)
                     │   ├─ /game      (2D 카드게임 — Phase 1)
                     │   └─ /game/3d   (3D 카드게임 — Phase 2)
                     │
                     ▼
              Firebase Hosting CDN ◀── GitHub Actions 자동 배포 (main push)
```

서버/DB/Auth 없음. 모든 게임 상태는 클라이언트 메모리에서만 살고 새로고침 시 사라진다.

## 2. 모듈 경계와 의존 방향

```
app/  ──▶  components/  ──▶  lib/store/  ──▶  lib/game/
                                              (순수 함수 + 상수, 부수효과 없음)
```

- **`lib/game/`** — 룰 로직과 상수. React를 import하지 않는다. Vitest로 단독 테스트 가능.
- **`lib/store/gameStore.ts`** — Zustand. 게임 흐름과 NPC 턴 스케줄링(`setTimeout`)을 담당.
- **`components/`** — 화면 단위 React 컴포넌트. `lib/store`만 호출하고 `lib/game`은 거의 직접 참조하지 않는다 (예외: `canPlay`로 카드 활성화 표시).
- **`app/`** — 라우트 진입점. 본문은 모두 `components/`로 위임.

상위 레이어가 하위 레이어로만 의존한다. 역방향 import 금지.

## 3. 라우팅 구조

| 라우트 | 파일 | 설명 |
|---|---|---|
| `/` | `src/app/page.tsx` | 랜딩, `Slideshow` (7개 슬라이드 자동 회전) |
| `/conditions/` | `src/app/conditions/page.tsx` | 참가 방법 (scroll-snap 4섹션) |
| `/rules/` | `src/app/rules/page.tsx` | 게임 룰 (scroll-snap 5섹션) |
| `/game/` | `src/app/game/page.tsx` | 2D 카드게임 (Phase 1) |
| `/game/3d/` | `src/app/game/3d/page.tsx` | 3D 카드게임 (Phase 2 placeholder) |

`output: 'export'` + `trailingSlash: true`로 모든 라우트가 `out/<path>/index.html`로 빌드된다.

## 4. 게임 흐름 / 상태

`useGameStore` 단일 스토어가 다음을 관리:

- `state: GameState | null` — 현재 라운드의 덱/손/턴
- `finalResults: FinalResult[] | null` — 게임 종료 시 누적 등수
- `toast` — 잠깐 떴다 사라지는 안내

**라이프사이클**:

```
[reset] ──▶ startGame ──▶ dealNewRound (R1)
                          ├─ playerPlayCard / playerDraw / playerQuit
                          │   └─ advanceTurn ──▶ scheduleNpcTurn
                          │                       └─ runNpcTurn (setTimeout)
                          │                          └─ advanceTurn …
                          └─ endRound
                              ├─ goNextRound (R<2) ──▶ dealNewRound (R2)
                              └─ rankResults (R≥2) ──▶ phase = 'finished'
```

NPC 턴은 `setTimeout`으로 1.1초 지연되며, `reset()` 시 타이머가 정리된다.

## 5. 빌드 / 배포

- 로컬: `pnpm dev` → `pnpm build` → `out/` 검증.
- CI: GitHub Actions(`.github/workflows/deploy.yml`) — `main` push 시 lint → type-check → build → `firebase deploy --only hosting`.
- 시크릿: `FIREBASE_SERVICE_ACCOUNT` (Repo settings → Secrets).
- 캐싱: `firebase.json`에서 `*.png|jpg|js|css`를 `immutable, max-age=31536000`로 지정.

## 6. 외부 의존성

| 의존성 | 용도 | 실패 시 영향 |
|---|---|---|
| Pretendard CDN (jsdelivr) | 본문 폰트 | system-ui 폴백, 시각적 저하만 |
| Firebase Hosting | 정적 호스팅 | (배포 실패 시 GitHub Pages 등으로 폴백 가능) |
| 캐릭터 PNG | UI 장식 | `public/`에 번들되어 동일 origin |

## 7. 디자인 토큰

`src/styles/globals.css`의 `@theme`이 단일 진실 공급원. 캠퍼스크루 배너에서 K-Means(k=8)로 추출:

- `--color-brand-deep #02388D`, `--color-brand #07519A`, `--color-brand-mid`, `--color-brand-sky`, `--color-brand-cyan`
- 카드/슬라이드쇼/토스트 등 컴포넌트 클래스도 같은 파일의 `@layer components`에 둔다.

## 8. Phase 2 확장 포인트

- `/game/3d/`에 R3F Canvas 추가, `lib/game/`은 그대로 재사용.
- 3D 자산은 `public/models/`(GLB/GLTF).
- 로딩 시간이 길면 2D로 자동 폴백할지 ADR로 결정.
