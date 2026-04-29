# Architecture Decision Records

이 디렉터리는 프로젝트의 **아키텍처 결정 기록(ADR)**을 보관합니다.

## 작성 규칙

- 파일명: `NNNN-제목-슬러그.md` (예: `0002-static-html-prototype.md`)
- 4자리 일련번호. 비우지 않고 순서대로 증가.
- **기존 ADR은 수정하지 않습니다.** 결정이 바뀌면:
  1. 새 ADR을 추가
  2. 이전 ADR의 Status를 `Superseded by ADR-NNNN`으로 변경 (이 한 줄만 수정 허용)

## 템플릿

```markdown
# ADR-NNNN: 제목

- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-NNNN
- **Date**: YYYY-MM-DD
- **Deciders**: 이름

## Context

왜 결정이 필요한가? 어떤 제약/배경이 있는가?

## Decision

무엇을 하기로 했는가?

## Consequences

이 결정의 결과로 얻는 것 / 잃는 것 / 추적해야 할 후속 작업.
```

## 목록

- [ADR-0001](0001-record-architecture-decisions.md) — ADR로 결정을 기록한다
