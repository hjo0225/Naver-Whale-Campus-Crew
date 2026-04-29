"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";

export function Toast() {
  const toast = useGameStore((s) => s.toast);
  const clearToast = useGameStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 2200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  return <div className={`toast ${toast ? "show" : ""}`}>{toast ?? ""}</div>;
}
