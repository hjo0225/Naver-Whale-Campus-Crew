"use client";

import { selectMySeat, usePvpStore } from "@/lib/store/pvpStore";

export function PvpResultScreen() {
  const room = usePvpStore((s) => s.room);
  const mySeat = usePvpStore(selectMySeat);
  const nextGame = usePvpStore((s) => s.nextGame);
  const mySlot = usePvpStore((s) => s.mySlot);

  const state = room?.state;
  if (!state || mySeat === null) return null;
  const history = state.roundHistory ?? [];
  const last = history[history.length - 1];
  if (!last) return null;

  const myRow = last.scores.find((s) => s.name === state.players[mySeat]?.name);
  const myPlace = myRow?.place ?? last.scores.length;

  const sorted = [...last.scores].sort((a, b) => a.place - b.place);

  const prizeLine =
    myPlace === 1
      ? "🏆 1등! 키캡 + 인형 둘 다!"
      : myPlace === last.scores.length
        ? "💪 응원품 받아 가세요"
        : `🎁 ${myPlace}등 — 키캡 또는 인형 택 1`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 p-8 shadow-2xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">결과</h1>
        <p className="mb-6 text-center text-lg font-semibold text-emerald-700">
          {prizeLine}
        </p>

        <div className="mb-6 space-y-2">
          {sorted.map((s) => {
            const isMe = s.name === state.players[mySeat]?.name;
            return (
              <div
                key={s.name}
                className={
                  "flex items-center justify-between rounded-xl px-4 py-2 " +
                  (isMe ? "bg-emerald-50 font-bold" : "bg-slate-50")
                }
              >
                <span>
                  {s.place}등 · {s.name}
                  {isMe && " (나)"}
                </span>
                <span className="text-slate-600">
                  {s.score === 0 ? "0" : `-${s.score}`}점
                </span>
              </div>
            );
          })}
        </div>

        {mySlot === "p0" ? (
          <button
            type="button"
            onClick={() => void nextGame()}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-600"
          >
            다음 게임 (운영진)
          </button>
        ) : (
          <p className="text-center text-sm text-slate-500">
            운영진이 다음 게임을 시작할 때까지 잠시만 기다려주세요
          </p>
        )}
      </div>
    </div>
  );
}
