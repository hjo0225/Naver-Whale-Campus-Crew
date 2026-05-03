"use client";

import dynamic from "next/dynamic";

// PvP 라우트에서만 firebase 청크를 로드 (솔로 번들 영향 0).
const PvpScreen = dynamic(() => import("@/components/game/pvp/PvpScreen"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <p>로딩 중…</p>
    </div>
  ),
});

export default function PvpPage() {
  return <PvpScreen />;
}
