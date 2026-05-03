"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Card, CardBack } from "@/components/game/Card";
import { canPlay } from "@/lib/game/rules";
import { canPlayerDraw, canPlayerQuit, isMyTurn } from "@/lib/pvp/engine";
import type { RoomPlayer, RoomState } from "@/lib/pvp/schema";
import { CHAR_IMAGES } from "@/lib/game/data";
import { selectMySeat, usePvpStore } from "@/lib/store/pvpStore";
import { cn } from "@/lib/utils";

type VisualPos = "bottom" | "top" | "left" | "right";

/** mySeat 기준 4개 좌석을 시각 위치로 매핑. 두 사람은 항상 위/아래에 마주 본다. */
function visualOrder(mySeat: 0 | 1): Record<VisualPos, number> {
  if (mySeat === 0) return { bottom: 0, top: 1, left: 2, right: 3 };
  return { bottom: 1, top: 0, left: 3, right: 2 };
}

function fanRotate(i: number, total: number): number {
  if (total <= 1) return 0;
  const spread = Math.min(34, total * 7);
  const step = spread / (total - 1);
  return -spread / 2 + i * step;
}

export function PvpBoard() {
  const room = usePvpStore((s) => s.room);
  const mySeat = usePvpStore(selectMySeat);
  const playCard = usePvpStore((s) => s.playCard);
  const drawCard = usePvpStore((s) => s.drawCard);
  const quit = usePvpStore((s) => s.quit);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const state = room?.state;
  if (!state || mySeat === null) return null;

  const order = visualOrder(mySeat);
  const me = state.players[order.bottom]!;
  const oppHuman = state.players[order.top]!;
  const npcLeft = state.players[order.left]!;
  const npcRight = state.players[order.right]!;

  const myTurn = isMyTurn(state, order.bottom);
  const drawDisabled = !canPlayerDraw(state, order.bottom);
  const quitDisabled = !canPlayerQuit(state, order.bottom);

  return (
    <div className="game-shell">
      <PvpSidebar
        state={state}
        mySeat={order.bottom}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
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
                      <motion.div
                        key={state.top.uid}
                        className="absolute inset-0"
                        initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Card card={state.top} size="large" />
                      </motion.div>
                    ) : (
                      <div className="empty-slot">비었음</div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 상단 — 상대 사람 (뒷면) */}
            <OpponentHand player={oppHuman} pos="top" hidden />

            {/* 좌우 — NPC 2명 (뒷면) */}
            <OpponentHand player={npcLeft} pos="left" hidden />
            <OpponentHand player={npcRight} pos="right" hidden />

            {/* 하단 — 나 (앞면, 클릭 가능) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center"
              style={{ bottom: "1rem", minHeight: "180px" }}
            >
              <AnimatePresence>
                {me.quitted ? (
                  <motion.div
                    key="quit-emoji-bottom"
                    initial={{ scale: 0.3, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                    className="text-8xl leading-none"
                    aria-label="그만"
                  >
                    ✋
                  </motion.div>
                ) : (
                  me.hand.map((card, idx) => {
                    const playable = myTurn && canPlay(card, state.top);
                    const rot = fanRotate(idx, me.hand.length);
                    return (
                      <motion.div
                        key={card.uid}
                        initial={{ scale: 0.55, opacity: 0, rotate: 0 }}
                        animate={{ scale: 1, opacity: 1, rotate: rot }}
                        exit={{ y: 80, opacity: 0, scale: 0.5 }}
                        transition={{
                          duration: 0.45,
                          delay: idx * 0.05,
                          ease: [0.22, 1, 0.36, 1],
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
                          disabled={myTurn && !playable}
                          onClick={() => void playCard(idx)}
                        />
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 보드 위 액션 바 (사이드바와 분리) */}
          <PvpActionBar
            myTurn={myTurn}
            drawDisabled={drawDisabled}
            quitDisabled={quitDisabled}
            deckEmpty={state.deck.length === 0}
            onDraw={() => void drawCard()}
            onQuit={() => void quit()}
          />

          {/* 보드 외부 4변 — 누구 자리인지 라벨 */}
          <div className="hand-chip-layer">
            <SeatChip player={oppHuman} pos="top" />
            <SeatChip player={npcLeft} pos="left" />
            <SeatChip player={npcRight} pos="right" />
            <SeatChip player={me} pos="bottom" isMe />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 서브 컴포넌트 =====

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

function OpponentHand({
  player,
  pos,
  hidden,
}: {
  player: RoomPlayer;
  pos: "top" | "left" | "right";
  hidden: boolean;
}) {
  const count = player.hand.length;

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
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className="text-7xl leading-none"
      aria-label="그만"
    >
      ✋
    </motion.div>
  );

  const renderCards = () =>
    player.hand.map((c, idx) => (
      <motion.div
        key={c.uid}
        initial={{ scale: 0.55, opacity: 0, rotate: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: fanRotate(idx, count) }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{
          duration: 0.45,
          delay: idx * 0.05,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="fan-wrap npc"
        style={{
          marginLeft: idx === 0 ? 0 : "-2.4rem",
          zIndex: idx,
        }}
      >
        {hidden ? <CardBack size="default" /> : <Card card={c} size="default" />}
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
          {player.quitted ? quitEmoji : renderCards()}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("side-hand", pos)}>
      <AnimatePresence>
        {player.quitted ? quitEmoji : renderCards()}
      </AnimatePresence>
    </div>
  );
}

function SeatChip({
  player,
  pos,
  isMe,
}: {
  player: RoomPlayer;
  pos: VisualPos;
  isMe?: boolean;
}) {
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
        {isMe && " (나)"}
      </span>
    </div>
  );
}

function PvpSidebar({
  state,
  mySeat,
  open,
  onToggle,
}: {
  state: RoomState;
  mySeat: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={cn("game-sidebar pvp-sidebar", !open && "collapsed")}>
      <button
        type="button"
        onClick={onToggle}
        className="pvp-sidebar-toggle"
        aria-label={open ? "사이드바 접기" : "사이드바 펼치기"}
      >
        {open ? "◀" : "▶"}
      </button>
      {open && (
        <>
          <header className="sidebar-header">
            <span className="sidebar-title">PvP 4인전</span>
            <span className="sidebar-meta">
              {state.phase === "playing" ? `턴: ${state.players[state.currentTurn]?.name ?? "-"}` : "—"}
            </span>
          </header>
          <div className="sidebar-players">
            {state.players.map((p, i) => (
              <div
                key={p.name}
                className={cn(
                  "player-row",
                  state.currentTurn === i && !p.quitted && state.phase === "playing" && "active",
                  p.quitted && "quitted",
                  i === mySeat && "is-player"
                )}
              >
                {p.char ? (
                  <img src={CHAR_IMAGES[p.char]} alt={p.name} className="player-row-avatar" />
                ) : (
                  <span className="player-row-avatar emoji" aria-hidden>
                    {p.isPlayer ? "🙂" : "🤖"}
                  </span>
                )}
                <div className="player-row-text">
                  <span className="player-row-name">
                    {p.name}
                    {i === mySeat && " (나)"}
                    {p.quitted && <span className="player-row-quit"> · 그만</span>}
                  </span>
                  <span className="player-row-meta">
                    {p.lastAction === null
                      ? "대기"
                      : p.lastAction.type === "play"
                        ? `방금 ${p.lastAction.card.value === "LLAMA" ? "라마" : p.lastAction.card.value}`
                        : p.lastAction.type === "draw"
                          ? "방금 뽑기"
                          : "그만"}
                  </span>
                </div>
                <span className="player-row-score">{p.hand.length}장</span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

function PvpActionBar({
  myTurn,
  drawDisabled,
  quitDisabled,
  deckEmpty,
  onDraw,
  onQuit,
}: {
  myTurn: boolean;
  drawDisabled: boolean;
  quitDisabled: boolean;
  deckEmpty: boolean;
  onDraw: () => void;
  onQuit: () => void;
}) {
  const drawLabel = !myTurn ? "🃏 카드 뽑기" : deckEmpty ? "덱 비었음" : "🃏 카드 뽑기";
  return (
    <div className="pvp-action-bar">
      <button
        type="button"
        className="cta-btn cta-btn-primary"
        disabled={drawDisabled}
        onClick={onDraw}
      >
        {drawLabel}
      </button>
      <button
        type="button"
        className="cta-btn cta-btn-danger"
        disabled={quitDisabled}
        onClick={onQuit}
      >
        ✋ 그만하기
      </button>
    </div>
  );
}
