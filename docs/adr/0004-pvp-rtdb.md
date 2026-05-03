# ADR-0004: PvP 모드 추가 — Firebase Realtime Database 채택

- **Status**: Accepted
- **Date**: 2026-05-03
- **Deciders**: 캠퍼스크루 팀
- **Supersedes**: ADR-0002 의 "백엔드/DB 미사용" 항목 부분 갱신 (Hosting + RTDB로 확장)

## Context

부스 노트북 2대를 활용해 손님끼리 직접 대전하는 체험을 제공하고 싶음. 단일 부스 PC 솔로 모드(NPC 3 + 손님 1)는 유지하면서, 별도 라우트로 PvP를 추가.

제약:
- 정적 익스포트(Next.js `output: 'export'`) — 서버 사이드 코드 없음
- D-day 2026-05-03 — 인프라 신규 운영 부담 최소화
- Firebase Hosting 이미 사용 중 — 추가 인프라 0이 이상적

## Decision

다음을 채택:

1. **통신 = Firebase Realtime Database (RTDB)**
   - Firestore보다 게임 동기화에 latency/listener 직관성 우위
   - Spark 무료 한도(100 동접/1GB 저장/10GB 다운로드) 안에서 부스 1개 운영 충분
   - 직접 WebSocket 서버 / WebRTC P2P는 D-day 안에 운영 부담 큼
2. **신뢰 기반 아키텍처** — 클라이언트가 자기 액션을 `/actions`에 push, 호스트가 listen해서 engine으로 적용 후 `/state` 전체 set. 부정행위 검증은 안 함 (운영진 통제로 수용).
3. **호스트 고정 (방을 만든 노트북)** — NPC 의사결정의 `Math.random()`을 단일 출처로. 호스트 마이그레이션 미구현, 호스트 disconnect 시 abort.
4. **모듈 격리** — 신규 `src/lib/pvp/`, `src/lib/store/pvpStore.ts`, `src/components/game/pvp/` 디렉터리. 솔로 코드는 거의 무수정 (등수/상품 함수만 `lib/game/scoring.ts`로 추출).
5. **라우트 = `/game/pvp/`** 단일 정적 라우트 + 단계 컴포넌트 스위치 (lobby/waiting/playing/finished/aborted). Next.js 정적 익스포트와 호환.
6. **번들 격리** — `firebase` 패키지는 `dynamic(() => import('@/components/game/pvp/PvpScreen'), { ssr: false })`로 PvP 라우트 진입 시에만 로드. 솔로 번들 영향 0.
7. **방 코드 = 4자리 (32 chars: 0/O/1/I 제외)** — `runTransaction`으로 원자적 점유, 충돌 시 5회 재시도.
8. **이탈 처리** — `onDisconnect`로 자동 offline, 호스트가 30초 grace 후 status=aborted.

## Consequences

### 긍정
- 부스 노트북 2대 활용 → 손님 체류 시간 ↑, SNS 인증 유도
- 솔로 코드/UX 회귀 위험 0 (분리 격리)
- Firebase Spark 무료로 운영 (사실상 0원)

### 부정/주의
- 부정행위 가능 (클라이언트 신뢰) — 부스 운영진 통제로 수용
- 호스트 disconnect 시 게임 abort, 자동 마이그레이션 없음 — 운영진 재매칭으로 우회
- 환경변수 5개 (`NEXT_PUBLIC_FIREBASE_*`) 필요 — `.env.local` + GitHub Actions secret
- `database.rules.json` 작성/배포 필요 (호스트만 state write, 슬롯 점유 transaction)
- Firebase 패키지 추가 ~60-90KB gzip (PvP 라우트만)

## Operational Notes

- Firebase Console에서 Realtime Database 활성화 (지역: asia-southeast1 권장)
- `database.rules.json` 배포: `pnpm dlx firebase deploy --only database --config config/firebase.json`
- 부스 운영: 두 노트북 모두 `/game/pvp/` 띄우기 → 한쪽 "방 만들기" → 코드 표시 → 다른쪽 코드 입력 → 자동 시작
- 결과 후 운영진이 "다음 게임" 클릭 → 방 정리 + 양쪽 lobby 복귀
