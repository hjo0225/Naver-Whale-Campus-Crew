# 네이버 웨일 캠퍼스크루 부스 게임

한양대 축제 부스에서 운영할 네이버 웨일 홍보용 카드게임 웹앱.
방문자 흐름: QR 스캔 → 추천인 코드 등록 → 부스 PC에서 NPC 2명과 카드게임 → 점수에 따라 상품 수령.

## 기술 스택

Next.js 15 (App Router · `output: "export"`) · React 19 · TypeScript 5 strict ·
Tailwind 4 · Zustand · Framer Motion · Vitest · Firebase Hosting · GitHub Actions

## 시작하기

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## 빌드 / 배포

```bash
pnpm build        # 정적 익스포트 → out/
pnpm deploy       # build + firebase deploy --only hosting
```

`main` 브랜치 push 시 GitHub Actions가 자동 배포한다 (Firebase 서비스 계정은 `FIREBASE_SERVICE_ACCOUNT` 시크릿).

## 폴더 구조

자세한 구조와 결정 배경은 [`docs/`](./docs/)와 [`CLAUDE.md`](./CLAUDE.md)를 참고.

## 운영 팁

- **추천인 코드 변경**: `src/lib/config.ts`의 `REFERRAL_CODE` 한 줄.
- **NPC / 라운드 / 핸드 수**: `src/lib/game/data.ts`의 `CONFIG`.
- **룰 변경**: 코드 고치기 전에 [`docs/game-rules.md`](./docs/game-rules.md)부터 갱신.
