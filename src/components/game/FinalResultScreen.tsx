"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/gameStore";
import { formatScore, deriveEndReason, describeEndReason } from "@/lib/game/rules";
import { CHAR_IMAGES } from "@/lib/game/data";
import { cn } from "@/lib/utils";

interface Headline {
  title: string;
  prizeText: string;
}

function headlineFor(place: number, totalPlayers: number): Headline {
  if (place === 1)
    return { title: "축하드립니다 1등입니다!", prizeText: "키캡 + 인형 둘 다 받으세요" };
  if (place === totalPlayers)
    return { title: "꽝!", prizeText: "다음에 또 도전해주세요" };
  return { title: `${place}등! 잘하셨어요`, prizeText: "키캡 또는 인형 중 1개 택1" };
}

function placeBadge(place: number): string {
  if (place === 1) return "🥇";
  if (place === 2) return "🥈";
  if (place === 3) return "🥉";
  return String(place);
}

export function FinalResultScreen() {
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const summary = useGameStore((s) => s.summary);
  const reset = useGameStore((s) => s.reset);
  const startGame = useGameStore((s) => s.startGame);

  if (!state || !summary) return null;
  const { title, prizeText } = headlineFor(summary.place, summary.totalPlayers);
  const isWin = summary.prize === "both";
  const isLoser = summary.prize === "cheer";
  const last = state.roundHistory[state.roundHistory.length - 1];
  const sortedScores = last
    ? [...last.scores].sort((a, b) => a.place - b.place)
    : [];
  const endReason = deriveEndReason(state.players);
  const endText = endReason ? describeEndReason(endReason) : null;

  return (
    <div className="h-[100dvh] max-w-[1100px] mx-auto px-8 flex flex-col justify-center items-center text-center">
      <span className="eyebrow mb-2">
        최종 결과 · 4명 중 {summary.place}등
      </span>
      {endText && (
        <span className="block text-base font-semibold text-(--color-text-secondary) mb-4">
          {endText.emoji} {endText.line}
        </span>
      )}
      <h1
        className={cn(
          "display-h1 mb-3",
          isWin && "text-(--color-brand)"
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "text-xl mb-10",
          isWin ? "text-(--color-brand)" : "text-(--color-text-secondary)"
        )}
      >
        {prizeText}
      </p>

      <div className="grid gap-3 w-full max-w-[640px] mb-10">
        {sortedScores.map((s) => (
          <div
            key={s.name}
            className={cn("result-row", s.isPlayer && "is-player")}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "w-11 h-11 flex items-center justify-center rounded-full bg-(--color-board-soft)",
                  s.place <= 3 ? "text-2xl" : "text-lg font-extrabold"
                )}
                aria-label={`${s.place}등`}
              >
                {placeBadge(s.place)}
              </div>
              {!s.isPlayer && (
                <span className="w-9 h-9 rounded-full overflow-hidden bg-(--color-board-soft) shrink-0">
                  {state.players.find((p) => p.name === s.name)?.char && (
                    <img
                      src={CHAR_IMAGES[state.players.find((p) => p.name === s.name)!.char!]}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </span>
              )}
              <div className="text-left">
                <div className="font-bold text-lg">
                  {s.name}
                  {s.isPlayer && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-(--color-action) text-white rounded">
                      나
                    </span>
                  )}
                  {s.quitted && (
                    <span className="ml-2 text-xs text-(--color-surface-text-muted)">그만</span>
                  )}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "text-2xl font-extrabold tabular-nums",
                s.score === 0 ? "text-(--color-surface-text-muted)" : "text-(--color-action)"
              )}
            >
              {formatScore(s.score)}
            </div>
          </div>
        ))}
      </div>

      {isLoser && (
        <div className="surface-card brand max-w-[520px] mx-auto mb-8 px-6 py-6 flex items-center gap-5">
          <div className="w-28 h-28 bg-white rounded-2xl shrink-0 overflow-hidden flex items-center justify-center">
            <img
              src="/qr.png"
              alt="재도전 QR 코드"
              className="w-full h-full object-contain p-1.5"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold tracking-[0.08em] mb-1 opacity-90">
              한 번 더 기회!
            </div>
            <p className="text-base leading-relaxed">
              QR 찍고 추천인 인증하면
              <br />
              현장에서 <strong>재도전</strong>할 수 있어요
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button
          className="cta-btn cta-btn-primary cta-btn-pill"
          onClick={() => {
            reset();
            startGame();
          }}
        >
          한 판 더
        </button>
        <button
          type="button"
          className="cta-btn cta-btn-ghost cta-btn-pill"
          onClick={() => {
            reset();
            router.push("/");
          }}
        >
          처음으로
        </button>
      </div>
    </div>
  );
}
