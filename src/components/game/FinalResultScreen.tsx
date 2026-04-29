"use client";

import Link from "next/link";
import { useGameStore } from "@/lib/store/gameStore";
import { formatScore } from "@/lib/game/rules";
import { cn } from "@/lib/utils";

interface Headline {
  title: string;
  prizeText: string;
}

function headlineFor(wins: number, totalRounds: number): Headline {
  if (wins === totalRounds)
    return { title: "완전 정복!", prizeText: "키캡 + 인형 둘 다 받으세요!" };
  if (wins > 0) return { title: "한 판은 잡았다!", prizeText: "키캡 또는 인형 중 1개 택1" };
  return { title: "다음에 또 도전해주세요!", prizeText: "참가 상품: 키캡 또는 인형 중 1개 택1" };
}

export function FinalResultScreen() {
  const state = useGameStore((s) => s.state);
  const summary = useGameStore((s) => s.summary);
  const reset = useGameStore((s) => s.reset);
  const startGame = useGameStore((s) => s.startGame);

  if (!state || !summary) return null;
  const { title, prizeText } = headlineFor(summary.wins, summary.totalRounds);
  const fullVictory = summary.prize === "both";

  return (
    <div className="h-[100dvh] max-w-[1100px] mx-auto px-8 flex flex-col justify-center items-center text-center">
      <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-4">
        최종 결과 · {summary.wins}승 {summary.totalRounds - summary.wins}패
      </span>
      <h1
        className={cn(
          "text-6xl font-extrabold tracking-tight leading-[1.05] mb-3",
          fullVictory && "text-(--color-brand)"
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "text-xl mb-10",
          fullVictory ? "text-(--color-brand)" : "text-(--color-text-secondary)"
        )}
      >
        {prizeText}
      </p>

      <div className="grid gap-3 w-full max-w-[760px] mb-10">
        {state.roundHistory.map((rh) => {
          const playerScore = rh.scores.find((s) => {
            const p = state.players.find((pl) => pl.name === s.name);
            return p?.isPlayer;
          });
          const oppScore = rh.scores.find((s) => {
            const p = state.players.find((pl) => pl.name === s.name);
            return !p?.isPlayer;
          });
          // history 시점의 players 정보가 라운드별로 다름 → opponentName 사용
          const labelForPlayer = rh.scores.find((s) => s.name === "손님");
          const labelForOpp = rh.scores.find((s) => s.name === rh.opponentName);
          const win = rh.outcome === "win";

          return (
            <div
              key={rh.round}
              className={cn(
                "flex items-center justify-between gap-6 px-6 py-5 border rounded-xl",
                win ? "border-(--color-brand) bg-(--color-brand-soft)" : "border-(--color-border)"
              )}
            >
              <div className="text-left">
                <div className="text-xs font-bold tracking-[0.12em] text-(--color-text-muted) mb-1">
                  R{rh.round} · vs {rh.opponentName}
                </div>
                <div
                  className={cn(
                    "font-extrabold text-lg",
                    win ? "text-(--color-brand)" : "text-(--color-text)"
                  )}
                >
                  {win ? (rh.wasTie ? "동점 → 승" : "승") : "패"}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-right">
                  <div className="text-(--color-text-muted)">손님</div>
                  <div className="font-bold">
                    {formatScore(labelForPlayer?.score ?? playerScore?.score ?? 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-(--color-text-muted)">{rh.opponentName}</div>
                  <div className="font-bold">
                    {formatScore(labelForOpp?.score ?? oppScore?.score ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          className="btn btn-primary btn-large"
          onClick={() => {
            reset();
            startGame();
          }}
        >
          한 판 더
        </button>
        <Link href="/" className="btn btn-secondary btn-large" onClick={() => reset()}>
          처음으로
        </Link>
      </div>
    </div>
  );
}
