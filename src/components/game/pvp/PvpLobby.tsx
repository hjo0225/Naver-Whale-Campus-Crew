"use client";

import { useState } from "react";
import { usePvpStore } from "@/lib/store/pvpStore";
import { normalizeRoomCode } from "@/lib/pvp/roomCode";

export function PvpLobby() {
  const hostNew = usePvpStore((s) => s.hostNew);
  const joinExisting = usePvpStore((s) => s.joinExisting);
  const busy = usePvpStore((s) => s.busy);
  const error = usePvpStore((s) => s.error);
  const setError = usePvpStore((s) => s.setError);

  const [mode, setMode] = useState<"choose" | "join">("choose");
  const [code, setCode] = useState("");

  const onJoin = () => {
    const normalized = normalizeRoomCode(code);
    if (!normalized) {
      setError("4자리 코드를 정확히 입력해주세요");
      return;
    }
    void joinExisting(normalized);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl">
        <h1 className="mb-2 text-center text-2xl font-bold">PvP 대전 모드</h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          노트북 두 대를 이어 손님끼리 대결
        </p>

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void hostNew()}
              className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-50"
            >
              방 만들기
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError(null);
                setMode("join");
              }}
              className="w-full rounded-2xl bg-sky-500 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-sky-600 disabled:opacity-50"
            >
              방 들어가기
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              4자리 방 코드
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
              placeholder="예: A3F7"
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest uppercase outline-none focus:border-sky-500"
            />
            <button
              type="button"
              disabled={busy}
              onClick={onJoin}
              className="w-full rounded-2xl bg-sky-500 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-sky-600 disabled:opacity-50"
            >
              입장
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode("choose");
                setCode("");
                setError(null);
              }}
              className="w-full rounded-2xl bg-slate-200 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
            >
              뒤로
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        )}
        {busy && (
          <p className="mt-4 text-center text-sm text-slate-500">처리 중…</p>
        )}
      </div>
    </div>
  );
}
