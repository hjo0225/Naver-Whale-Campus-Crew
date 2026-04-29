# API Specification

> 현재 정적 HTML 프로토타입 단계로 실제 백엔드는 없습니다.
> 추후 추천인 코드 발급/검증, 결과 수집을 서버화할 때 본 문서에 채워 넣습니다.

## 0. 공통 규약

- **Base URL**: TBD
- **인증**: TBD (운영진용 어드민 토큰 등)
- **Content-Type**: `application/json; charset=utf-8`
- **에러 포맷**:
  ```json
  { "error": { "code": "STRING", "message": "사람이 읽을 수 있는 메시지" } }
  ```


## 2. 게임 결과

### 2.1 `POST /game-results` — 결과 기록

요청
```json
{
  "code": "ABCD1234",
  "rounds": [
    { "round": 1, "scores": [{ "name": "손님", "score": -3 }] }
  ],
  "finalRank": 1,
  "playedAt": "..."
}
```

응답
```json
{ "ok": true, "id": "result-uuid" }
```

## 3. 통계 (운영 대시보드, optional)

- `GET /stats/registrations?from=&to=` — 코드 등록 수
- `GET /stats/games?from=&to=` — 게임 플레이 수, 평균 점수

## 4. 변경 이력

| 날짜 | 버전 | 변경 사항 |
|---|---|---|
| 2026-04-29 | 0.1 | 초기 스켈레톤 작성 |
