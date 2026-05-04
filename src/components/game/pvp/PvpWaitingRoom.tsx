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
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "var(--brand-grad)" }}
    >
      <div className="surface-card w-full max-w-md text-center" style={{ padding: "2rem" }}>
        <span className="eyebrow block mb-2">PvP 대전</span>
        <h1
          className="text-2xl font-extrabold tracking-tight mb-1"
          style={{ color: "var(--color-text)" }}
        >
          {isHost ? "방을 열었어요" : "입장했어요"}
        </h1>

        {/* 호스트 전용 — 방 코드 표시 */}
        {isHost && code && (
          <>
            <p className="text-sm mt-2 mb-5" style={{ color: "var(--color-text-secondary)" }}>
              친구 노트북에 아래 코드를 입력하세요
            </p>
            <div
              className="rounded-xl py-6 px-4 mb-5"
              style={{ background: "var(--color-board-soft)", border: "1.5px solid var(--color-divider)" }}
            >
              <div
                className="text-5xl font-mono font-bold tracking-[0.4em]"
                style={{ color: "var(--color-action-cyan)" }}
              >
                {code}
              </div>
            </div>
          </>
        )}

        {/* 참가자 목록 */}
        <div
          className="rounded-xl p-4 text-left mb-5"
          style={{ background: "var(--color-board-soft)", border: "1px solid var(--color-divider)" }}
        >
          <div
            className="mb-2 flex items-center justify-between text-sm font-bold"
            style={{ color: "var(--color-text)" }}
          >
            <span>참가자</span>
            <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
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
                <div
                  key={k}
                  className="flex justify-between py-1"
                  style={{
                    borderBottom: i < SLOT_KEYS.length - 1 ? "1px solid var(--color-divider)" : undefined,
                  }}
                >
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {filled ? displayName : `P${i + 1}`}
                    {i === 0 && (
                      <span className="ml-1 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                        (호스트)
                      </span>
                    )}
                    {isMe && (
                      <span className="ml-1 text-xs font-bold" style={{ color: "var(--color-brand)" }}>
                        (나)
                      </span>
                    )}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: filled ? "var(--color-action-cyan)" : "var(--color-text-muted)" }}
                  >
                    {filled ? "✓ 입장" : "비어있음"}
                  </span>
                </div>
              );
            })}
          </div>
          {npcCount > 0 && (
            <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
              빈 자리는 웨일프렌즈 NPC가 채워서 4인전으로 진행돼요.
            </p>
          )}
        </div>

        {error && (
          <p
            className="mb-3 rounded-lg px-3 py-2 text-sm"
            style={{ background: "#fef2f2", color: "#b91c1c" }}
          >
            {error}
          </p>
        )}

        {isHost ? (
          <>
            <button
              type="button"
              disabled={!canStart || busy}
              onClick={() => void startGame()}
              className="cta-btn cta-btn-primary w-full mb-2"
            >
              {canStart
                ? `게임 시작 (사람 ${humanCount} + NPC ${npcCount})`
                : "사람 2명 이상 모이면 시작 가능"}
            </button>
            <p className="mb-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
              지금 시작하면 비어있는 자리는 NPC로 채워집니다
            </p>
          </>
        ) : (
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            호스트가 게임을 시작할 때까지 기다려주세요
          </p>
        )}

        <button
          type="button"
          onClick={() => void leave()}
          className="cta-btn cta-btn-ghost"
          style={{ padding: "0.65rem 1.5rem" }}
        >
          나가기
        </button>
      </div>
    </div>
  );
}
