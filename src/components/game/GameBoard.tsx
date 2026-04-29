"use client";

import { useGameStore, isPlayerFirstTurn } from "@/lib/store/gameStore";
import { canPlay } from "@/lib/game/rules";
import { CHAR_IMAGES, CONFIG } from "@/lib/game/data";
import type { Action } from "@/lib/game/types";
import { Card, CardBack } from "./Card";
import { cn } from "@/lib/utils";

function formatAction(action: Action | null): string {
  if (!action) return "";
  if (action.type === "play") {
    const v = action.card.value === "LLAMA" ? "라마" : action.card.value;
    return `방금 ${v} 냄`;
  }
  if (action.type === "draw") return "방금 뽑기";
  if (action.type === "quit") return "그만하기";
  return "";
}

export function GameBoard() {
  const state = useGameStore((s) => s.state);
  const playerPlayCard = useGameStore((s) => s.playerPlayCard);
  const playerDraw = useGameStore((s) => s.playerDraw);
  const playerQuit = useGameStore((s) => s.playerQuit);

  if (!state) return null;
  const player = state.players[0];
  if (!player) return null;
  const npcs = state.players.slice(1);
  const opponent = npcs[0];
  const isPlayerTurn = state.currentTurn === 0 && !player.quitted && state.phase === "playing";
  const activeCount = state.players.filter((p) => !p.quitted).length;
  const isSoloActive = !player.quitted && activeCount === 1;
  const cur = state.players[state.currentTurn];
  const firstTurn = isPlayerFirstTurn(state);
  const hasPlayable = isPlayerTurn && player.hand.some((c) => canPlay(c, state.top));
  const drawDisabled = !isPlayerTurn || isSoloActive || (firstTurn && hasPlayable);
  const quitDisabled = !isPlayerTurn || firstTurn;

  return (
    <div className="h-[100dvh] max-w-[1300px] mx-auto px-6 py-4 flex flex-col gap-3 overflow-hidden">
      {/* Header + 전적 strip — 한 줄로 압축 */}
      <header className="flex items-center justify-between gap-4 pb-3 border-b border-(--color-border)">
        <h1 className="text-xl font-extrabold tracking-tight whitespace-nowrap">
          {opponent?.name}과 한 판{" "}
          <span className="ml-2 text-sm font-medium text-(--color-text-secondary)">
            R{state.round}/{state.totalRounds}
          </span>
        </h1>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="text-xs font-bold text-(--color-text-muted) tracking-wider">전적</span>
          {CONFIG.opponents.map((opp, i) => {
            const past = state.roundHistory.find((h) => h.round === i + 1);
            const isCurrent = i + 1 === state.round && state.phase === "playing";
            return (
              <span
                key={opp.name}
                className={cn(
                  "px-2 py-1 rounded font-semibold text-xs",
                  past?.outcome === "win" && "bg-(--color-brand) text-white",
                  past?.outcome === "lose" && "bg-(--color-border-strong) text-white",
                  !past && isCurrent && "border border-(--color-brand) text-(--color-brand)",
                  !past && !isCurrent && "border border-(--color-border) text-(--color-text-muted)"
                )}
              >
                R{i + 1} {opp.name}
                {past && ` · ${past.outcome === "win" ? "승" : "패"}${past.wasTie ? " (동점)" : ""}`}
              </span>
            );
          })}
        </div>
        <div
          className={cn(
            "px-3 py-1.5 border rounded-md text-sm font-semibold whitespace-nowrap",
            cur?.isPlayer
              ? "border-(--color-brand) text-(--color-brand)"
              : "border-(--color-border) text-(--color-text-secondary)"
          )}
        >
          {cur?.name} 차례
        </div>
      </header>

      {/* 게임판 본체: 3행 grid (NPC / center / Player), 남는 세로 공간을 center가 흡수 */}
      <div className="flex-1 grid grid-rows-[auto_1fr_auto] gap-2 min-h-0">
        {/* NPC area */}
        <section className="flex justify-center">
          {npcs.map((npc, i) => {
            const isActive =
              state.currentTurn === i + 1 && !npc.quitted && state.phase === "playing";
            return (
              <div key={npc.name} className="text-center">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 mb-2 border rounded-md font-semibold text-sm",
                    npc.quitted
                      ? "border-(--color-border-light) text-(--color-text-muted) bg-(--color-bg-soft)"
                      : isActive
                        ? "border-(--color-brand) text-(--color-brand)"
                        : "border-(--color-border)"
                  )}
                >
                  {npc.char && (
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full bg-(--color-bg-soft) overflow-hidden inline-flex",
                        npc.quitted && "opacity-50 grayscale"
                      )}
                    >
                      <img
                        src={CHAR_IMAGES[npc.char]}
                        alt={npc.name}
                        className="w-full h-full object-cover"
                      />
                    </span>
                  )}
                  <span>
                    {npc.name}
                    {npc.quitted && " (그만)"}
                  </span>
                  <span className="text-xs text-(--color-text-muted) font-medium">
                    {npc.hand.length}장
                  </span>
                  {formatAction(npc.lastAction) && (
                    <span className="pl-2 border-l border-(--color-border) text-xs font-semibold text-(--color-brand)">
                      {formatAction(npc.lastAction)}
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  {npc.hand.map((c, idx) => (
                    <div key={c.uid} style={{ marginLeft: idx === 0 ? 0 : "-1.5rem" }}>
                      <CardBack size="mini" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* center: deck + top — 남는 공간을 차지하며 가운데 정렬 */}
        <section className="flex justify-center items-center gap-16 border-y border-(--color-border-light) min-h-0">
          <div className="text-center">
            <div className="text-xs font-semibold text-(--color-text-muted) mb-1 tracking-wider">
              덱 <span className="text-(--color-text) font-bold">{state.deck.length}</span>장
            </div>
            <CardBack size="default" />
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-(--color-text-muted) mb-1 tracking-wider">바닥</div>
            {state.top && <Card card={state.top} size="large" />}
          </div>
        </section>

        {/* Player area */}
        <section className="text-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 mb-2 border rounded-md font-semibold text-sm",
              player.quitted
                ? "border-(--color-border-light) text-(--color-text-muted) bg-(--color-bg-soft)"
                : isPlayerTurn
                  ? "border-(--color-brand) text-(--color-brand)"
                  : "border-(--color-border)"
            )}
          >
            <span>
              {player.name}
              {player.quitted && " (그만)"}
            </span>
            <span className="text-xs text-(--color-text-muted) font-medium">
              {player.hand.length}장
            </span>
            {formatAction(player.lastAction) && (
              <span className="pl-2 border-l border-(--color-border) text-xs font-semibold text-(--color-brand)">
                {formatAction(player.lastAction)}
              </span>
            )}
            {firstTurn && hasPlayable && (
              <span className="pl-2 border-l border-(--color-border) text-xs font-semibold text-(--color-brand)">
                첫 턴 — 일단 한 장!
              </span>
            )}
          </div>

          <div className="flex gap-2 justify-center items-center mb-3 min-h-[170px] flex-wrap">
            {player.hand.length === 0 ? (
              <div className="text-(--color-text-muted) py-6">손에 카드 없음</div>
            ) : (
              player.hand.map((card, idx) => {
                const playable = isPlayerTurn && canPlay(card, state.top);
                return (
                  <Card
                    key={card.uid}
                    card={card}
                    size="large"
                    playable={playable}
                    disabled={isPlayerTurn && !playable}
                    onClick={() => playerPlayCard(idx)}
                  />
                );
              })
            )}
          </div>

          <div className="flex gap-3 justify-center items-center">
            {isPlayerTurn && isSoloActive && (
              <span className="text-xs text-(--color-text-muted) mr-2">
                혼자 남았어요 — 낼 카드만 내거나 그만하기
              </span>
            )}
            <button className="btn btn-secondary" disabled={drawDisabled} onClick={playerDraw}>
              {isSoloActive
                ? "뽑기 불가(혼자 남음)"
                : firstTurn && hasPlayable
                  ? "첫 턴엔 일단 내기"
                  : isPlayerTurn && state.deck.length === 0
                    ? "덱 비어있음"
                    : "카드 뽑기"}
            </button>
            <button className="btn btn-secondary" disabled={quitDisabled} onClick={playerQuit}>
              {firstTurn ? "첫 턴엔 그만 못함" : "그만하기"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
