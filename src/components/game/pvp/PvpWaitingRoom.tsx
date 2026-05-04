"use client";

import { selectHumanCount, usePvpStore } from "@/lib/store/pvpStore";
import { SLOT_KEYS } from "@/lib/pvp/schema";

export function PvpWaitingRoom() {
  const code = usePvpStore((s) => s.code);
  const room = usePvpStore((s) => s.room);
  const mySlot = usePvpStore((s) => s.mySlot);
  const leave = usePvpStore((s) => s.leave);
  const startGame = usePvpStore((s) => s.startGame);
  const busy = usePvpStore((s) => s.busy);
  const error = usePvpStore((s) => s.error);
  const humanCount = usePvpStore(selectHumanCount);

  const isHost = mySlot === "p0";
  const npcCount = Math.max(0, 4 - humanCount);
  const canStart = humanCount >= 2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl">
        <h1 className="mb-2 text-xl font-bold text-slate-800">
          {isHost ? "방을 열었어요" : "입장했어요"}
        </h1>

        {isHost && code && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              친구 노트북에 아래 코드를 입력하세요
            </p>
            <div className="my-6 rounded-2xl bg-slate-100 p-6">
              <div className="text-5xl font-mono font-bold tracking-[0.4em] text-emerald-600">
                {code}
              </div>
            </div>
          </>
        )}

        <div className="my-6 rounded-2xl bg-slate-50 p-4 text-left">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>참가자</span>
            <span className="text-xs text-slate-500">
              사람 {humanCount}/4 · NPC {npcCount}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            {SLOT_KEYS.map((k, i) => {
              const slot = room?.slots?.[k];
              const filled = Boolean(slot);
              const isMe = mySlot === k;
              const displayName = slot?.name?.trim() || `P${i + 1}`;
              return (
                <div key={k} className="flex justify-between">
                  <span>
                    {filled ? displayName : `P${i + 1}`}
                    {i === 0 && " (호스트)"}
                    {isMe && " · 나"}
                  </span>
                  <span className={filled ? "text-emerald-600" : "text-slate-400"}>
                    {filled ? "✓ 입장" : "비어있음"}
                  </span>
                </div>
              );
            })}
          </div>
          {npcCount > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              빈 자리는 웨일프렌즈 NPC가 채워서 4인전으로 진행돼요.
            </p>
          )}
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {isHost ? (
          <>
            <button
              type="button"
              disabled={!canStart || busy}
              onClick={() => void startGame()}
              className="mb-3 w-full rounded-2xl bg-emerald-500 py-3 text-base font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canStart
                ? `게임 시작 (사람 ${humanCount} + NPC ${npcCount})`
                : "사람 2명 이상 모이면 시작 가능"}
            </button>
            <p className="mb-4 text-xs text-slate-500">
              지금 시작하면 비어있는 자리는 NPC로 채워집니다
            </p>
          </>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            호스트가 게임을 시작할 때까지 기다려주세요
          </p>
        )}

        <button
          type="button"
          onClick={() => void leave()}
          className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
        >
          나가기
        </button>
      </div>
    </div>
  );
}
