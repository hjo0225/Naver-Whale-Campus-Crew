# ADR-0002: Next.js 정적 익스포트 + Firebase Hosting 채택

- **Status**: Accepted
- **Date**: 2026-04-30
- **Deciders**: 캠퍼스크루 팀

## Context

v6 단일 HTML 프로토타입을 부스 운영에 그대로 쓸 수도 있지만:

- 5개 슬라이드 / 3 단계 안내 / 5 룰 페이지 / 게임 보드를 한 파일에 욱여넣어 유지보수가 어렵다.
- Phase 2의 3D 카드게임(three.js + R3F)을 동일 파일에 추가하면 무너진다.
- 빠른 dev/preview 사이클이 필요하다 (D-day 5/3까지 4일).

서버가 필요한 SSR / DB / Auth 요구는 현재 없다. 단일 부스 PC 1대만 쓰고, 추천 코드 검증/결과 저장은 운영진 수기 처리.

## Decision

- **Next.js 15 App Router**, `output: 'export'`로 **정적 빌드만 사용**.
- **Firebase Hosting** (Firestore/Auth 미사용) — `*.web.app` 기본 도메인.
- **GitHub Actions**로 main push → 자동 배포.
- 상태 관리: **Zustand** (단일 스토어, 단일 단말).
- UI: **Tailwind 4** + 인라인 컴포넌트 클래스 + Framer Motion (애니메이션).
- 테스트: **Vitest** (룰 함수 단위 테스트만).

## Consequences

- 백엔드 인프라 비용/유지보수 0.
- CDN 캐싱으로 부스 네트워크가 약해도 버틴다.
- 정적 익스포트 제약: 동적 라우트, ISR, API Route 사용 불가. 추후 서버 기능이 필요하면 ADR-0003에서 재논의.
- Phase 2의 3D는 `/game/3d/`에 별 라우트로 분리해 2D를 안전한 폴백으로 유지.
