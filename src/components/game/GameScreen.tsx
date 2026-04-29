"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { GameBoard } from "./GameBoard";
import { RoundResult } from "./RoundResult";
import { FinalResultScreen } from "./FinalResultScreen";

export function GameScreen() {
  const state = useGameStore((s) => s.state);
  const startGame = useGameStore((s) => s.startGame);

  useEffect(() => {
    if (!state) startGame();
  }, [state, startGame]);

  if (!state) return null;

  if (state.phase === "finished") return <FinalResultScreen />;
  if (state.phase === "roundEnded") return <RoundResult />;
  return <GameBoard />;
}
