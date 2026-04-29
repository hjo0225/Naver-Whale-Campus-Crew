# Project Context

네이버웨일 홍보를 위한 한양대 축제 부스 운영 웹 애플리케이션.

방문자가 QR 코드 스캔 → 네이버 웨일 추천인 코드 등록 → 부스에서
"웨일프렌즈" 캐릭터들과 카드게임 대결 → 점수에 따라 경품 안내까지의
온·오프라인 연계 흐름을 제공합니다.

## Goals

- 네이버 웨일(브라우저) 핵심 기능(웨일 스페이스, 웨일온, 사이드바) 인지 제고
- 추천인 코드 등록 전환(다운로드 → 코드 입력)
- 부스 체류 시간 확보용 미니 카드게임 (NPC 2 + 플레이어 1, 2라운드)

## Operating Environment

- 부스 PC 1대 + 외부 모니터, 운영진(네이버 서포터즈)이 조작
- 손님은 구두로 카드 선택 → 운영진이 클릭 (모바일 게임 플레이 미지원)
- 단일 단말 / 외부 의존 최소화 / Firebase Hosting CDN 정적 배포
- Phase 1: 2D 카드게임 (D-day 5/3) · Phase 2: 3D (행사 본행사까지)

## Tech Stack

- Next.js 15 (App Router, `output: 'export'`) · React 19 · TypeScript 5 strict
- Tailwind CSS 4 · Framer Motion · Pretendard Variable
- Zustand (단일 게임 스토어)
- Vitest (룰 함수 단위 테스트)
- Firebase Hosting (정적) · GitHub Actions
- Phase 2: three.js + @react-three/fiber + drei + spring (별도 라우트)

## Directory Map

- `src/app/` — 페이지 라우트 (`/`, `/conditions`, `/rules`, `/game`, `/game/3d`)
- `src/components/` — `landing/` `game/` `game-3d/` `ui/`
- `src/lib/game/` — 순수 룰 로직 (`data`, `deck`, `rules`, `npcAi`, `types`)
- `src/lib/store/gameStore.ts` — Zustand 스토어 (게임 흐름 / NPC 턴 스케줄링)
- `src/lib/config.ts` — 부스 운영 설정 (`REFERRAL_CODE` 한 줄만 바꾸면 전체 반영)
- `src/styles/globals.css` — Tailwind 4 `@theme` + 카드/슬라이드쇼 컴포넌트 클래스
- `public/characters/` — 웨일프렌즈 PNG (영문 키 이름)
- `docs/` — PRD / API / Architecture / DATA_MODEL / ADR / CHANGELOG
- `asset/` — 원본 v6 HTML 프로토타입과 디자인 자료 (배포에 포함되지 않음)

## Commands

```bash
pnpm install          # 최초 1회
pnpm dev              # 개발 서버 (http://localhost:3000)
pnpm build            # 정적 익스포트 → out/
pnpm test:run         # 룰 단위 테스트
pnpm type-check       # TS 컴파일 검증
pnpm deploy           # build + firebase deploy --only hosting
```

## Reference Documents (Progressive Disclosure)

필요한 시점에만 다음 문서를 읽으세요. 자동 로드하지 마세요.

### Product Requirements — `@docs/PRD.md`

**Read when:** 새 기능 추가, 사용자 흐름 변경, 수용 기준(acceptance criteria) 확인 시

### API Specification — `@docs/api-spec.md`

**Read when:** API 엔드포인트 추가/수정, 요청·응답 스키마 변경 시

### Architecture — `@docs/ARCHITECTURE.md`

**Read when:** 모듈 경계 변경, 새 외부 의존성 추가, 데이터 흐름 변경 시

### Data Model — `@docs/DATA_MODEL.md`

**Read when:** DB 스키마, 마이그레이션, 데이터 변환 로직 작업 시

### Game Rules — `@docs/game-rules.md`

**Read when:** 카드 매칭 규칙, 점수 계산, NPC AI 휴리스틱을 변경할 때

### Booth Operations — `@docs/booth-operations.md`

**Read when:** 부스 운영 흐름, 운영진 멘트(난이도 비공개), 손님 FAQ를 다룰 때

### Changelog — `@docs/CHANGELOG.md`

**Read when:** 릴리즈 노트 작성, "최근 무슨 일 있었지?" 확인 시

### Decision Log — `@docs/adr/`

**Read when:** "왜 이렇게 설계됐는지" 알아야 할 때. 새로운 아키텍처 결정 시 새 ADR 추가.

## Workflow Rules

- 코드 변경이 명세서와 어긋나면, **반드시 `docs/` 안 해당 문서를 먼저 갱신**한 뒤 코드를 수정합니다.
- API 시그니처가 바뀌면 `api-spec.md`와 `CHANGELOG.md`를 같이 업데이트합니다.
- 아키텍처 결정이 바뀌면 기존 ADR을 수정하지 말고, 새 ADR을 추가하고 이전 것을 "Superseded by ADR-XXXX"로 표시합니다.

## IMPORTANT

- 명세서 없이 추측으로 코드를 작성하지 않습니다. 불명확하면 사용자에게 질문합니다.
- `docs/` 안 파일들이 **단일 진실 공급원(Single Source of Truth)**입니다.
