# Data Model

> DB 없음. 모든 모델은 **클라이언트 인메모리 타입**이며, 새로고침 시 휘발한다.
> 정의는 `src/lib/game/types.ts`에 위치하며 본 문서가 그 의도/제약의 단일 진실 공급원이다.

## 1. 카드

### 1.1 `CardType`
원본 카드 정의 (싱글톤 상수, `src/lib/game/data.ts`).

```ts
{
  id: number | "L",
  value: 1 | 2 | 3 | 4 | 5 | "LLAMA",
  points: number,            // 1..5, 라마=8
  name: string,              // '별이' | '달토' | '페포' | '고스트웨일' | '네이버웨일' | '라마'
  char: CharKey | null,
  themeColor: string,
  isLlama?: boolean
}
```

### 1.2 `Card extends CardType`
덱에 들어간 한 장의 인스턴스. `uid`로 React key를 안정화한다.

```ts
{ ...CardType, uid: number }
```

## 2. 플레이어

```ts
type Player = {
  name: string,                    // '손님' | NPC 이름
  hand: Card[],
  quitted: boolean,                // 라운드 이탈 여부
  isPlayer: boolean,               // 사람 플레이어인지 (UI 강조용)
  lastAction: Action | null,
  char: CharKey | null
}

type Action =
  | { type: "play"; card: Card }
  | { type: "draw" }
  | { type: "quit" }
```

`players[0]`은 항상 사람 플레이어. NPC는 그 뒤로 `CONFIG.npcs` 순서로 들어간다.

## 3. 게임 상태

```ts
type GamePhase = "playing" | "roundEnded" | "finished"

type GameState = {
  players: Player[],               // [손님, NPC1, NPC2]
  deck: Card[],
  top: Card | null,
  currentTurn: number,             // players 인덱스
  phase: GamePhase,
  round: number,                   // 1-based
  totalRounds: number,
  totalScores: Record<string, number>,
  roundHistory: Array<{
    round: number,
    scores: Array<{ name: string; score: number; hand: Card[] }>
  }>
}
```

## 4. 결과

```ts
type FinalResult = {
  name: string,
  isPlayer: boolean,
  score: number,                   // 누적
  breakdown: number[],             // 라운드별 점수 (양수)
  rank: number                     // 1-based, 동점 처리
}
```

## 5. 상태 전이 (라운드 한 번)

```
phase = "playing"
  ├─ playerPlayCard / playerDraw / playerQuit
  ├─ runNpcTurn (setTimeout)
  └─ endRound ────▶ phase = "roundEnded"
                    ├─ round < totalRounds → goNextRound → "playing"
                    └─ round = totalRounds → phase = "finished" (finalResults 채움)
```

## 6. 점수 계산 규칙 (의도된 함정)

같은 `value`의 카드를 여러 장 들고 있어도 **1번만** 카운트. 코드(`calculateScore`의 `Map<value, points>`)와 룰 문서, 안내 화면이 항상 일치해야 한다 — 한 곳만 바꾸면 기능 버그.

## 7. (예정) 서버 모델

서버화 시 `docs/api-spec.md`의 엔드포인트와 함께 마이그레이션 정의 작성.
