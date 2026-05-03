"use client";

import { usePvpStore } from "@/lib/store/pvpStore";

export function PvpWaitingRoom() {
  const code = usePvpStore((s) => s.code);
  const room = usePvpStore((s) => s.room);
  const mySlot = usePvpStore((s) => s.mySlot);
  const leave = usePvpStore((s) => s.leave);

  const otherJoined =
    mySlot === "p0" ? Boolean(room?.slots?.p1) : Boolean(room?.slots?.p0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl">
        <h1 className="mb-2 text-xl font-bold text-slate-800">
          {mySlot === "p0" ? "방을 열었어요" : "입장했어요"}
        </h1>

        {mySlot === "p0" && code && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              상대 노트북에 아래 코드를 입력하세요
            </p>
            <div className="my-6 rounded-2xl bg-slate-100 p-6">
              <div className="text-5xl font-mono font-bold tracking-[0.4em] text-emerald-600">
                {code}
              </div>
            </div>
          </>
        )}

        <div className="my-6 rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-700">참가자</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>호스트 (P1)</span>
              <span className={room?.slots?.p0 ? "text-emerald-600" : "text-slate-400"}>
                {room?.slots?.p0 ? "✓ 입장" : "대기중…"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>게스트 (P2)</span>
              <span className={room?.slots?.p1 ? "text-emerald-600" : "text-slate-400"}>
                {room?.slots?.p1 ? "✓ 입장" : "대기중…"}
              </span>
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          {otherJoined
            ? "잠시 후 게임이 시작됩니다…"
            : mySlot === "p0"
              ? "상대 입장을 기다리는 중"
              : "호스트가 게임을 시작할 때까지 대기 중"}
        </p>

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
