"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { deriveEndReason } from "@/lib/game/rules";
import { GameBoard } from "./GameBoard";
import { FinalResultScreen } from "./FinalResultScreen";
import { EndSplash } from "./EndSplash";

const SPLASH_MS = 1800;

export function GameScreen() {
  const state = useGameStore((s) => s.state);
  const startGame = useGameStore((s) => s.startGame);
  const [splashShown, setSplashShown] = useState(false);
  // 첫 마운트 1회만 자동 시작. "처음으로" 클릭 시 navigation 중 reset 으로
  // state=null 이 되더라도 여기서 다시 게임을 만들면 안 된다.
  const initedRef = useRef(false);

  useEffect(() => {
    if (!state && !initedRef.current) {
      initedRef.current = true;
      startGame();
    }
  }, [state, startGame]);

  // 종료 phase 진입 시 1.8s splash 후 결과 화면 전이
  useEffect(() => {
    if (state?.phase === "finished") {
      setSplashShown(true);
      const t = setTimeout(() => setSplashShown(false), SPLASH_MS);
      return () => clearTimeout(t);
    }
    setSplashShown(false);
  }, [state?.phase]);

  if (!state) return null;

  if (state.phase === "finished") {
    if (splashShown) {
      const reason = deriveEndReason(state.players);
      return (
        <>
          <GameBoard />
          {reason && <EndSplash reason={reason} />}
        </>
      );
    }
    return <FinalResultScreen />;
  }

  return <GameBoard />;
}
