"use client";

import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/pvp/rtdb";
import { usePvpStore } from "@/lib/store/pvpStore";
import { deriveEndReason } from "@/lib/game/rules";
import type { Player } from "@/lib/game/types";
import { EndSplash } from "@/components/game/EndSplash";
import { PvpBoard } from "./PvpBoard";
import { PvpLobby } from "./PvpLobby";
import { PvpResultScreen } from "./PvpResultScreen";
import { PvpWaitingRoom } from "./PvpWaitingRoom";

const SPLASH_MS = 3000;

export default function PvpScreen() {
  const phase = usePvpStore((s) => s.phase);
  const room = usePvpStore((s) => s.room);
  const init = usePvpStore((s) => s.init);
  const [splashShown, setSplashShown] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured()) void init();
  }, [init]);

  // 종료 phase 진입 시 SPLASH_MS 동안 EndSplash 노출 후 결과 화면 전이.
  useEffect(() => {
    if (phase === "finished") {
      setSplashShown(true);
      const t = setTimeout(() => setSplashShown(false), SPLASH_MS);
      return () => clearTimeout(t);
    }
    setSplashShown(false);
  }, [phase]);

  if (!isFirebaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
          <h2 className="mb-2 text-lg font-bold text-red-600">Firebase 설정 필요</h2>
          <p className="text-sm text-slate-700">
            <code>.env.local</code>에 <code>NEXT_PUBLIC_FIREBASE_*</code> 5개 키를 채워주세요.
            <br />
            (<code>.env.local.example</code> 참고)
          </p>
        </div>
      </div>
    );
  }

  if (phase === "lobby") return <PvpLobby />;
  if (phase === "waiting") return <PvpWaitingRoom />;
  if (phase === "playing") return <PvpBoard />;
  if (phase === "finished") {
    if (splashShown) {
      // RoomPlayer는 Player 필드를 모두 포함 (name/hand/quitted/isPlayer/lastAction/char)
      const players = (room?.state?.players ?? []) as unknown as Player[];
      const reason = deriveEndReason(players);
      return (
        <>
          <PvpBoard />
          {reason && <EndSplash reason={reason} />}
        </>
      );
    }
    return <PvpResultScreen />;
  }
  if (phase === "aborted") return <PvpAborted />;
  return null;
}

function PvpAborted() {
  const leave = usePvpStore((s) => s.leave);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl">
        <h2 className="mb-2 text-xl font-bold text-slate-800">게임이 중단됐어요</h2>
        <p className="mb-6 text-sm text-slate-600">
          상대 연결이 끊겼거나 운영진이 방을 닫았습니다.
        </p>
        <button
          type="button"
          onClick={() => void leave()}
          className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-600"
        >
          로비로
        </button>
      </div>
    </div>
  );
}
