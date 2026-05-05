"use client";

import { selectHumanCount, usePvpStore } from "@/lib/store/pvpStore";
import { SLOT_KEYS } from "@/lib/pvp/schema";

const glassHeader: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(255,255,255,0.15)",
};

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
    <div className="h-screen flex flex-col" style={{ background: "var(--brand-grad)" }}>

      {/* 헤더 */}
      <header className="flex items-center justify-between px-8 py-4 flex-shrink-0" style={glassHeader}>
        <div>
          <span className="block text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
            PvP 대전
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
            {isHost ? "대기실 — 방장" : "대기실 — 게스트"}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void leave()}
          className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "white",
          }}
        >
          나가기
        </button>
      </header>

      {/* 본문 */}
      <div className="flex-1 grid gap-5 p-5 overflow-hidden" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* 좌측 — 방 코드 + 안내 */}
        <div className="surface-card flex flex-col p-7 overflow-hidden">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--color-text)" }}>
              방 코드
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {isHost
                ? "이 코드를 친구에게 알려주세요"
                : "아래 코드로 입장했어요"}
            </p>
          </div>

          {/* 코드 디스플레이 */}
          <div
            className="flex-1 flex flex-col items-center justify-center rounded-2xl"
            style={{
              background: "var(--color-board-soft)",
              border: "1.5px solid var(--color-divider)",
            }}
          >
            <div
              className="font-mono font-black tracking-[0.35em] select-all"
              style={{
                fontSize: "clamp(3rem, 6vw, 5rem)",
                color: "var(--color-action-cyan)",
              }}
            >
              {code ?? "----"}
            </div>
            <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
              4자리 방 코드
            </p>
          </div>

          <div className="mt-6 rounded-xl p-4" style={{ background: "var(--color-brand-soft)", border: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-brand)" }}>
              게임 안내
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              최대 4명 참가 · 빈 자리는 웨일프렌즈 NPC가 채워요.
              {isHost && " 사람 2명 이상이면 바로 시작할 수 있어요."}
            </p>
          </div>
        </div>

        {/* 우측 — 참가자 목록 + 시작 */}
        <div className="surface-card flex flex-col p-7 overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold" style={{ color: "var(--color-text)" }}>
              참가자
            </h2>
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              사람 {humanCount}/4 · NPC {npcCount}
            </span>
          </div>

          {/* 슬롯 목록 */}
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {SLOT_KEYS.map((k, i) => {
              const slot = room?.slots?.[k];
              const filled = Boolean(slot);
              const isMe = mySlot === k;
              const isHostSlot = i === 0;
              const displayName = slot?.name?.trim() || `P${i + 1}`;

              return (
                <div
                  key={k}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4"
                  style={{
                    background: filled
                      ? isMe
                        ? "var(--color-brand-soft)"
                        : "var(--color-board-soft)"
                      : "var(--color-board-soft)",
                    border: `1.5px solid ${
                      isMe
                        ? "var(--color-brand)"
                        : filled
                        ? "var(--color-divider)"
                        : "var(--color-border-light)"
                    }`,
                    opacity: filled ? 1 : 0.55,
                  }}
                >
                  {/* 아바타 원 */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{
                      background: filled
                        ? isMe
                          ? "var(--color-brand)"
                          : "var(--color-action-cyan)"
                        : "var(--color-border)",
                      color: filled ? "white" : "var(--color-text-muted)",
                    }}
                  >
                    {filled ? displayName[0]?.toUpperCase() ?? "?" : i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-bold text-base truncate"
                        style={{ color: "var(--color-text)" }}
                      >
                        {filled ? displayName : `P${i + 1} 슬롯`}
                      </span>
                      {isHostSlot && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--color-accent)", color: "var(--color-accent-deep)" }}
                        >
                          호스트
                        </span>
                      )}
                      {isMe && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--color-brand)", color: "white" }}
                        >
                          나
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: filled ? "var(--color-action-cyan)" : "var(--color-text-muted)" }}
                    >
                      {filled ? "✓ 입장 완료" : "비어있음"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* NPC 안내 */}
          {npcCount > 0 && (
            <p className="mt-4 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
              빈 자리 {npcCount}개는 웨일프렌즈 NPC로 채워집니다
            </p>
          )}

          {/* 에러 */}
          {error && (
            <p
              className="mt-3 rounded-lg px-3 py-2.5 text-sm text-center"
              style={{ background: "#fef2f2", color: "#b91c1c" }}
            >
              {error}
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="mt-5">
            {isHost ? (
              <>
                <button
                  type="button"
                  disabled={!canStart || busy}
                  onClick={() => void startGame()}
                  className="cta-btn cta-btn-primary cta-btn-large w-full mb-2"
                >
                  {canStart
                    ? `게임 시작 — 사람 ${humanCount}명 + NPC ${npcCount}명`
                    : "사람 2명 이상 모이면 시작 가능"}
                </button>
                {!canStart && (
                  <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                    친구가 코드로 입장하면 바로 시작할 수 있어요
                  </p>
                )}
              </>
            ) : (
              <div
                className="rounded-xl px-4 py-4 text-center"
                style={{ background: "var(--color-board-soft)", border: "1px solid var(--color-divider)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                  호스트가 게임을 시작할 때까지 기다려주세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
