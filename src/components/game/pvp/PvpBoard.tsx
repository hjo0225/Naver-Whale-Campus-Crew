"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Card, CardBack } from "@/components/game/Card";
import { canPlay } from "@/lib/game/rules";
import { canPlayerDraw, canPlayerQuit, isMyTurn } from "@/lib/pvp/engine";
import type { RoomPlayer } from "@/lib/pvp/schema";
import { CHAR_IMAGES } from "@/lib/game/data";
import { selectMySeat, usePvpStore } from "@/lib/store/pvpStore";
import { cn } from "@/lib/utils";

type VisualPos = "bottom" | "top" | "left" | "right";

/** 좌석 0~3 사람 플레이어 식별용 동물 이모지. */
const SEAT_EMOJIS = ["🐳", "🦊", "🐻", "🐰"] as const;
function seatEmoji(seat: number): string {
  return SEAT_EMOJIS[seat] ?? "🐳";
}

/**
 * mySeat 기준 4 좌석을 시각 위치로 매핑.
 * 항상 하단=나, 나머지는 (mySeat+1, mySeat+2, mySeat+3) 순으로
 * left → top → right 위치에 배치 (시계 방향 흐름).
 */
function visualOrder(mySeat: number, total: number): Record<VisualPos, number> {
  // 안전: total은 항상 4 (사람 2~4 + NPC = 4)
  const next = (k: number) => (mySeat + k) % total;
  return {
    bottom: mySeat,
    left: next(1),
    top: next(2),
    right: next(3),
  };
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

  const state = room?.state;
  if (!state || mySeat === null) return null;

  const order = visualOrder(mySeat, state.players.length);
  const me = state.players[order.bottom]!;
  const topP = state.players[order.top]!;
  const leftP = state.players[order.left]!;
  const rightP = state.players[order.right]!;

  const myTurn = isMyTurn(state, order.bottom);
  const drawDisabled = !canPlayerDraw(state, order.bottom);
  const quitDisabled = !canPlayerQuit(state, order.bottom);

  return (
    <div className="game-shell">
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

            {/* 상단 / 좌우 — 다른 플레이어 (사람·NPC 모두 뒷면) */}
            <OpponentHand player={topP} pos="top" hidden />
            <OpponentHand player={leftP} pos="left" hidden />
            <OpponentHand player={rightP} pos="right" hidden />

            {/* 테이블 내부 좌하단 — 그만하기 / 우하단 — 카드 뽑기 */}
            <PvpActionBar
              myTurn={myTurn}
              drawDisabled={drawDisabled}
              quitDisabled={quitDisabled}
              deckEmpty={state.deck.length === 0}
              onDraw={() => void drawCard()}
              onQuit={() => void quit()}
            />

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

          {/* 보드 외부 4변 — 누구 자리인지 라벨 */}
          <div className="hand-chip-layer">
            <SeatChip player={topP} seat={order.top} pos="top" />
            <SeatChip player={leftP} seat={order.left} pos="left" />
            <SeatChip player={rightP} seat={order.right} pos="right" />
            <SeatChip player={me} seat={order.bottom} pos="bottom" isMe />
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
  seat,
  pos,
  isMe,
}: {
  player: RoomPlayer;
  seat: number;
  pos: VisualPos;
  isMe?: boolean;
}) {
  const positionClass = {
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
  }[pos];

  // 사람 = 좌석 동물 이모지 / NPC = 웨일프렌즈 캐릭터 이미지
  const avatar = player.isPlayer ? (
    <span className="hand-chip-avatar emoji" aria-hidden>
      {seatEmoji(seat)}
    </span>
  ) : player.char ? (
    <span className="hand-chip-avatar">
      <img src={CHAR_IMAGES[player.char]} alt="" />
    </span>
  ) : (
    <span className="hand-chip-avatar emoji" aria-hidden>
      🤖
    </span>
  );

  return (
    <div className={cn("hand-chip", positionClass)}>
      {avatar}
      <span className="text-xs font-medium">
        {player.name}
        {isMe && " (나)"}
      </span>
    </div>
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
    <>
      <button
        type="button"
        className="cta-btn cta-btn-danger absolute bottom-4 left-4 z-20"
        disabled={quitDisabled}
        onClick={onQuit}
      >
        ✋ 그만하기
      </button>
      <button
        type="button"
        className="cta-btn cta-btn-primary absolute bottom-4 right-4 z-20"
        disabled={drawDisabled}
        onClick={onDraw}
      >
        {drawLabel}
      </button>
    </>
  );
}
