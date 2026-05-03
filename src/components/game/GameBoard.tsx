"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, isPlayerFirstTurn } from "@/lib/store/gameStore";
import { canPlay } from "@/lib/game/rules";
import { CHAR_IMAGES } from "@/lib/game/data";
import type { Action, GameState, Player } from "@/lib/game/types";
import { Card, CardBack } from "./Card";
import { cn } from "@/lib/utils";

// ===== 헬퍼 =====

function metaForBadge(action: Action | null): string {
  if (!action) return "대기";
  if (action.type === "play") {
    const v = action.card.value === "LLAMA" ? "라마" : action.card.value;
    return `방금 ${v}`;
  }
  if (action.type === "draw") return "방금 뽑기";
  if (action.type === "quit") return "그만";
  return "대기";
}

function fanRotate(i: number, total: number): number {
  if (total <= 1) return 0;
  const spread = Math.min(34, total * 7);
  const step = spread / (total - 1);
  return -spread / 2 + i * step;
}

// 모션 타이밍
const EASE = [0.22, 1, 0.36, 1] as const;

// 카드 내기 — 손패 위치에서 출발 → 보드 중앙에서 큰 사이즈로 잠깐 멈춤 → 바닥 슬롯 안착
const PLAY_STAGING_DURATION = 1.1;
const PLAY_STAGING_TIMES = [0, 0.3, 0.65, 1] as const;

// 카드 뽑기/분배 — 덱 위치에서 출발 → 살짝 큰 사이즈 → 자기 위치/회전으로 축소
const DEAL_DURATION = 0.85;
const DEAL_TIMES = [0, 0.3, 0.55, 1] as const;

/**
 * 방금 카드를 낸 플레이어의 손패 → 바닥 슬롯 기준 offset.
 * 바닥 슬롯이 (0, 0) 기준이고 hand 위치를 향한 좌표.
 */
function getThrowOrigin(state: GameState): { x: number; y: number } {
  const top = state.top;
  if (!top) return { x: 0, y: 0 };
  const idx = state.players.findIndex(
    (p) => p.lastAction?.type === "play" && p.lastAction.card.uid === top.uid
  );
  switch (idx) {
    case 0:
      return { x: 0, y: 380 }; // 손님 (보드 하단)
    case 1:
      return { x: 0, y: -380 }; // top NPC (보드 상단)
    case 2:
      return { x: -460, y: 0 }; // left NPC
    case 3:
      return { x: 460, y: 0 }; // right NPC
    default:
      return { x: 0, y: 0 };
  }
}

// 덱 위치 — 손패 자기 위치(0)에서 덱(보드 중앙 살짝 좌측)까지의 offset.
// 손패에 새 카드가 들어올 때 이 좌표에서 출발.
const DECK_FROM_PLAYER = { x: -90, y: -380 } as const; // 손님: 보드 중앙(좌측 + 위쪽)
const DECK_FROM_NPC_TOP = { x: -90, y: 380 } as const; // top NPC: 보드 중앙(좌측 + 아래쪽)
// side hand는 90°/-90° 회전 컨테이너 — motion y가 화면상 x 방향. 둘 다 +380 (덱 = 화면 중앙).
const DECK_FROM_NPC_SIDE = { x: 0, y: 380 } as const;

// ===== 메인 =====

export function GameBoard() {
  const state = useGameStore((s) => s.state);
  const playerPlayCard = useGameStore((s) => s.playerPlayCard);
  const playerDraw = useGameStore((s) => s.playerDraw);
  const playerQuit = useGameStore((s) => s.playerQuit);

  if (!state) return null;
  const player = state.players[0];
  if (!player) return null;
  const npcs = state.players.slice(1);

  const isPlayerTurn =
    state.currentTurn === 0 && !player.quitted && state.phase === "playing";
  const activeCount = state.players.filter((p) => !p.quitted).length;
  const isSoloActive = !player.quitted && activeCount === 1;
  const firstTurn = isPlayerFirstTurn(state);
  const hasPlayable = isPlayerTurn && player.hand.some((c) => canPlay(c, state.top));
  const deckEmpty = state.deck.length === 0;
  const drawDisabled =
    !isPlayerTurn || isSoloActive || (firstTurn && hasPlayable) || deckEmpty;
  const quitDisabled = !isPlayerTurn || firstTurn;

  const drawLabel = isSoloActive
    ? "뽑기 불가"
    : isPlayerTurn && state.deck.length === 0
      ? "덱 비었음"
      : "🃏 카드 뽑기";
  const quitLabel = "✋ 그만하기";

  return (
    <div className="game-shell">
      <Sidebar
        state={state}
        isPlayerTurn={isPlayerTurn}
        isSoloActive={isSoloActive}
        drawDisabled={drawDisabled}
        quitDisabled={quitDisabled}
        drawLabel={drawLabel}
        quitLabel={quitLabel}
        onDraw={playerDraw}
        onQuit={playerQuit}
      />
      <div className="game-area">
        <div className="game-table-wrap">
          <div className="game-table">
            {/* 가운데 — 덱 + 바닥 */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center"
              style={{ gap: "3.5rem" }}
            >
              <DeckStack count={state.deck.length} />
              <div>
                <div className="center-label">바닥</div>
                <div style={{ width: 116, height: 168 }} className="relative">
                  <AnimatePresence mode="popLayout">
                    {state.top ? (
                      (() => {
                        const origin = getThrowOrigin(state);
                        return (
                          <motion.div
                            key={state.top.uid}
                            className="absolute inset-0"
                            initial={{
                              x: origin.x,
                              y: origin.y,
                              scale: 0.7,
                              opacity: 0,
                              rotate: -8,
                            }}
                            animate={{
                              x: [origin.x, 0, 0, 0],
                              y: [origin.y, -50, -50, 0],
                              scale: [0.7, 1.5, 1.5, 1],
                              opacity: [0, 1, 1, 1],
                              rotate: [-8, 2, 2, 0],
                            }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{
                              duration: PLAY_STAGING_DURATION,
                              times: [...PLAY_STAGING_TIMES],
                              ease: EASE,
                            }}
                          >
                            <Card card={state.top} size="large" />
                          </motion.div>
                        );
                      })()
                    ) : (
                      <div className="empty-slot">비었음</div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* NPC 핸드 — 정사각형 탁자 상/좌/우 변 안쪽 */}
            {npcs[0] && (
              <NpcHand hand={npcs[0].hand} pos="top" quitted={npcs[0].quitted} />
            )}
            {npcs[1] && (
              <NpcHand hand={npcs[1].hand} pos="left" quitted={npcs[1].quitted} />
            )}
            {npcs[2] && (
              <NpcHand hand={npcs[2].hand} pos="right" quitted={npcs[2].quitted} />
            )}

            {/* 손님 핸드 — 테두리 가까이. 그만하기 시 카드 페이드 + ✋ 이모지로 대체 */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center"
              style={{ bottom: "1rem", minHeight: "180px" }}
            >
              <AnimatePresence>
                {player.quitted ? (
                  <motion.div
                    key="quit-emoji-bottom"
                    initial={{ scale: 0.3, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 180,
                      damping: 18,
                      delay: 0.35,
                    }}
                    className="text-8xl leading-none"
                    aria-label="그만"
                  >
                    ✋
                  </motion.div>
                ) : (
                  player.hand.map((card, idx) => {
                    const playable = isPlayerTurn && canPlay(card, state.top);
                    const rot = fanRotate(idx, player.hand.length);
                    return (
                      <motion.div
                        key={card.uid}
                        initial={{
                          x: DECK_FROM_PLAYER.x,
                          y: DECK_FROM_PLAYER.y,
                          scale: 0.55,
                          opacity: 0,
                          rotate: 0,
                        }}
                        animate={{
                          x: [DECK_FROM_PLAYER.x, -40, -40, 0],
                          y: [DECK_FROM_PLAYER.y, -180, -180, 0],
                          scale: [0.55, 1.4, 1.4, 1],
                          opacity: [0, 1, 1, 1],
                          rotate: [0, 0, 0, rot],
                        }}
                        exit={{
                          y: 80,
                          opacity: 0,
                          scale: 0.5,
                          transition: { duration: 0.4 },
                        }}
                        transition={{
                          duration: DEAL_DURATION,
                          delay: idx * 0.08,
                          times: [...DEAL_TIMES],
                          ease: EASE,
                        }}
                        className="fan-wrap player"
                        style={{
                          marginLeft: idx === 0 ? 0 : "-2.4rem",
                          zIndex: idx,
                        }}
                      >
                        <Card
                          card={card}
                          size="large"
                          playable={playable}
                          disabled={isPlayerTurn && !playable}
                          onClick={() => playerPlayCard(idx)}
                        />
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Hand chip 레이어 — 보드 외부 4변에 배치 (overflow 영향 없음) */}
          <div className="hand-chip-layer">
            {npcs[0] && <HandChip player={npcs[0]} pos="top" />}
            {npcs[1] && <HandChip player={npcs[1]} pos="left" />}
            {npcs[2] && <HandChip player={npcs[2]} pos="right" />}
            <HandChip player={player} pos="bottom" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 서브 컴포넌트 =====

interface SidebarProps {
  state: GameState;
  isPlayerTurn: boolean;
  isSoloActive: boolean;
  drawDisabled: boolean;
  quitDisabled: boolean;
  drawLabel: string;
  quitLabel: string;
  onDraw: () => void;
  onQuit: () => void;
}

function Sidebar({
  state,
  isPlayerTurn,
  isSoloActive,
  drawDisabled,
  quitDisabled,
  drawLabel,
  quitLabel,
  onDraw,
  onQuit,
}: SidebarProps) {
  return (
    <aside className="game-sidebar">
      <header className="sidebar-header">
        <span className="sidebar-title">웨일 카드게임</span>
        <span className="sidebar-meta">4인 1판</span>
      </header>
      <div className="sidebar-players">
        {state.players.map((p, i) => (
          <SidebarPlayerRow
            key={p.name}
            player={p}
            active={
              state.currentTurn === i && !p.quitted && state.phase === "playing"
            }
          />
        ))}
      </div>
      <div className="sidebar-actions">
        <div className="sidebar-actions-row">
          <button
            className="cta-btn cta-btn-primary"
            disabled={drawDisabled}
            onClick={onDraw}
          >
            {drawLabel}
          </button>
          <button
            className="cta-btn cta-btn-danger"
            disabled={quitDisabled}
            onClick={onQuit}
          >
            {quitLabel}
          </button>
        </div>
        {isPlayerTurn && isSoloActive && (
          <p className="sidebar-hint muted">혼자 남았어요 — 낼 수 있는 카드만</p>
        )}
      </div>
    </aside>
  );
}

function SidebarPlayerRow({
  player,
  active,
}: {
  player: Player;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "player-row",
        active && "active",
        player.quitted && "quitted",
        player.isPlayer && "is-player"
      )}
    >
      {player.char ? (
        <img
          src={CHAR_IMAGES[player.char]}
          alt={player.name}
          className="player-row-avatar"
        />
      ) : (
        <span className="player-row-avatar emoji" aria-hidden>
          😀
        </span>
      )}
      <div className="player-row-text">
        <span className="player-row-name">
          {player.name}
          {player.isPlayer && " (나)"}
          {player.quitted && <span className="player-row-quit"> · 그만</span>}
        </span>
        <span className="player-row-meta">{metaForBadge(player.lastAction)}</span>
      </div>
      <span className="player-row-score">{player.hand.length}장</span>
    </div>
  );
}

function DeckStack({ count }: { count: number }) {
  return (
    <div>
      <div className="center-label">덱 {count}장</div>
      <div className="deck-stack">
        {count > 2 && (
          <div
            className="deck-shadow"
            style={{ transform: "translate(6px, 6px) rotate(2.5deg)", opacity: 0.55 }}
          >
            <CardBack size="large" />
          </div>
        )}
        {count > 0 && (
          <div
            className="deck-shadow"
            style={{ transform: "translate(3px, 3px) rotate(-1.5deg)", opacity: 0.8 }}
          >
            <CardBack size="large" />
          </div>
        )}
        {count > 0 ? <CardBack size="large" /> : <div className="empty-slot">덱 비었음</div>}
      </div>
    </div>
  );
}

function HandChip({
  player,
  pos,
}: {
  player: Player;
  pos: "top" | "left" | "right" | "bottom";
}) {
  // 보드 외부 4변에 배치 — `.hand-chip-layer` 안 absolute.
  const positionClass = {
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
  }[pos];

  return (
    <div className={cn("hand-chip", positionClass)}>
      {player.char ? (
        <span className="hand-chip-avatar">
          <img src={CHAR_IMAGES[player.char]} alt="" />
        </span>
      ) : (
        <span className="hand-chip-avatar emoji" aria-hidden>
          😀
        </span>
      )}
      <span>
        {player.name}
        {player.isPlayer && " (나)"}
      </span>
    </div>
  );
}

function NpcHand({
  hand,
  pos,
  quitted,
}: {
  hand: Player["hand"];
  pos: "top" | "left" | "right";
  quitted: boolean;
}) {
  const count = hand.length;
  // top 컨테이너는 180° 회전 — motion 로컬 좌표가 화면 좌표 기준으로 부호 반전.
  // 덱은 화면상 컨테이너 아래쪽이므로, 회전 프레임에서는 motion +y(위)가 아닌 -y로 잡아야 한다.
  const flipTop = pos === "top" ? -1 : 1;
  const deckOrigin =
    pos === "top"
      ? { x: -DECK_FROM_NPC_TOP.x, y: -DECK_FROM_NPC_TOP.y }
      : DECK_FROM_NPC_SIDE;
  const stagedY = 180 * flipTop;
  const stagedX = pos === "top" ? 45 : 0;

  // 그만하기 시 카드 자리에 ✋ 이모지. 회전 컨테이너 안에선 카운터 회전으로 정자세 유지.
  const quitEmoji = (
    <motion.div
      key="quit-emoji"
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate:
          pos === "left" ? -90 : pos === "right" ? 90 : pos === "top" ? 180 : 0,
      }}
      exit={{ scale: 0.3, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 180,
        damping: 18,
        delay: 0.35,
      }}
      className="text-7xl leading-none"
      aria-label="그만"
    >
      ✋
    </motion.div>
  );

  const renderCards = () =>
    hand.map((c, idx) => (
      <motion.div
        key={c.uid}
        initial={{
          x: deckOrigin.x,
          y: deckOrigin.y,
          scale: 0.55,
          opacity: 0,
          rotate: 0,
        }}
        animate={{
          x: [deckOrigin.x, stagedX, stagedX, 0],
          y: [deckOrigin.y, stagedY, stagedY, 0],
          scale: [0.55, 1.35, 1.35, 1],
          opacity: [0, 1, 1, 1],
          rotate: [0, 0, 0, fanRotate(idx, count)],
        }}
        exit={{ y: 120 * flipTop, opacity: 0, scale: 0.5, transition: { duration: 0.4 } }}
        transition={{
          duration: DEAL_DURATION,
          delay: idx * 0.08,
          times: [...DEAL_TIMES],
          ease: EASE,
        }}
        className="fan-wrap npc"
        style={{
          marginLeft: idx === 0 ? 0 : "-2.4rem",
          zIndex: idx,
        }}
      >
        <CardBack size="default" />
      </motion.div>
    ));

  if (pos === "top") {
    return (
      <div
        className="absolute left-1/2 flex justify-center items-center"
        style={{
          top: "1rem",
          minHeight: "140px",
          transform: "translateX(-50%) rotate(180deg)",
        }}
      >
        <AnimatePresence>
          {quitted ? quitEmoji : renderCards()}
        </AnimatePresence>
      </div>
    );
  }

  // 좌·우 — 컨테이너 자체를 90° 회전
  return (
    <div className={cn("side-hand", pos)}>
      <AnimatePresence>
        {quitted ? quitEmoji : renderCards()}
      </AnimatePresence>
    </div>
  );
}
