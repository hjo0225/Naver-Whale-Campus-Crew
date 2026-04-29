"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { formatScore } from "@/lib/game/rules";
import { cn } from "@/lib/utils";

export function RoundResult() {
  const state = useGameStore((s) => s.state);
  const goNextRound = useGameStore((s) => s.goNextRound);

  if (!state) return null;
  const last = state.roundHistory[state.roundHistory.length - 1];
  if (!last) return null;

  const headline =
    last.outcome === "win"
      ? last.wasTie
        ? `${last.opponentName}과 동점, 손님 승!`
        : `${last.opponentName} 격파!`
      : `이번엔 ${last.opponentName}이 한 수 위...`;

  return (
    <div className="h-[100dvh] max-w-[900px] mx-auto px-8 flex flex-col justify-center items-center text-center">
      <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-4">
        라운드 {last.round} / {state.totalRounds} 결과
      </span>
      <h1
        className={cn(
          "text-5xl font-extrabold tracking-tight leading-[1.1] mb-8",
          last.outcome === "win" ? "text-(--color-brand)" : "text-(--color-text)"
        )}
      >
        {headline}
      </h1>

      <div className="flex flex-col gap-3 w-full max-w-[560px] mb-10">
        {last.scores.map((s) => {
          const player = state.players.find((p) => p.name === s.name);
          const isPlayer = player?.isPlayer ?? false;
          return (
            <div
              key={s.name}
              className={cn(
                "flex items-center justify-between px-6 py-4 border rounded-xl",
                isPlayer
                  ? "border-(--color-brand) bg-(--color-brand-soft)"
                  : "border-(--color-border)"
              )}
            >
              <div className="font-bold text-lg">
                {s.name}
                {isPlayer && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-(--color-brand) text-white rounded">
                    나
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "text-2xl font-extrabold",
                  s.score === 0 ? "text-(--color-text-muted)" : "text-(--color-brand)"
                )}
              >
                {formatScore(s.score)}점
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary btn-large" onClick={goNextRound}>
        다음 상대 ▶
      </button>
    </div>
  );
}
