# ADR-0001: ADR로 아키텍처 결정을 기록한다

- **Status**: Accepted
- **Date**: 2026-04-29
- **Deciders**: 캠퍼스크루 팀

## Context

부스 게임 프로토타입이 여러 버전(초안 → v3 → v5 → v6)을 거치며 진화 중이고, 정적 HTML에서 추후 서버 백엔드로 확장이 예상된다. "왜 이렇게 했는지"가 사라지면 후속 작업자가 같은 논의를 반복하게 된다.

## Decision

- `docs/adr/` 안에 ADR을 누적 기록한다.
- 형식은 Michael Nygard 스타일의 짧은 문서: Context / Decision / Consequences.
- 결정이 뒤집히면 새 ADR을 추가하고 이전 ADR을 `Superseded by` 처리한다.

## Consequences

- 후속 참여자가 결정 배경을 빠르게 따라잡을 수 있다.
- 매번 "왜 이렇게 됐죠?" 미팅을 반복하지 않는다.
- 단, ADR 작성/유지에 약간의 추가 비용이 든다 — 결정이 사소하면 굳이 ADR로 만들 필요는 없다.
