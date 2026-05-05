"use client";

import { useEffect, useState } from "react";
import {
  NICKNAME_MAX,
  loadStoredNickname,
  sanitizeNickname,
  usePvpStore,
} from "@/lib/store/pvpStore";
import { normalizeRoomCode } from "@/lib/pvp/roomCode";

function formatAge(createdAt: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (sec < 60) return "방금";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  return `${Math.floor(min / 60)}시간 전`;
}

const glassHeader: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(255,255,255,0.15)",
};

const glassChip: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.25)",
};

export function PvpLobby() {
  const hostNew = usePvpStore((s) => s.hostNew);
  const joinExisting = usePvpStore((s) => s.joinExisting);
  const watchLobby = usePvpStore((s) => s.watchLobby);
  const unwatchLobby = usePvpStore((s) => s.unwatchLobby);
  const openRooms = usePvpStore((s) => s.openRooms);
  const busy = usePvpStore((s) => s.busy);
  const error = usePvpStore((s) => s.error);
  const setError = usePvpStore((s) => s.setError);
  const nickname = usePvpStore((s) => s.nickname);
  const setNickname = usePvpStore((s) => s.setNickname);

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!usePvpStore.getState().nickname) {
      const saved = loadStoredNickname();
      if (saved) setNickname(saved);
    }
  }, [setNickname]);

  const nicknameMissing = mounted && !nickname;
  const showNicknameGate = nicknameMissing || editingNick;

  useEffect(() => {
    if (!mounted) return;
    if (nicknameMissing) return;
    void watchLobby();
    return () => unwatchLobby();
  }, [watchLobby, unwatchLobby, nicknameMissing, mounted]);

  const onSaveNickname = () => {
    const clean = sanitizeNickname(nickDraft);
    if (!clean) {
      setError("닉네임을 입력해주세요");
      return;
    }
    setError(null);
    setNickname(clean);
    setEditingNick(false);
    setNickDraft("");
  };

  /* ── 닉네임 게이트 ── */
  if (showNicknameGate) {
    return (
      <div
        className="h-screen flex items-center justify-center px-4"
        style={{ background: "var(--brand-grad)" }}
      >
        <div className="surface-card w-full max-w-sm" style={{ padding: "2.5rem 2rem" }}>
          <span className="eyebrow block text-center mb-3">PvP 대전</span>
          <h1
            className="text-2xl font-extrabold text-center mb-1 tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            닉네임 설정
          </h1>
          <p className="text-center text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
            보드에 표시될 이름이에요 (최대 {NICKNAME_MAX}자)
          </p>

          <input
            type="text"
            value={nickDraft}
            onChange={(e) => setNickDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSaveNickname(); }}
            maxLength={NICKNAME_MAX * 3}
            autoFocus
            placeholder="예: 웨일맨"
            className="mb-4 w-full rounded-xl border-2 bg-white px-4 py-3 text-center text-lg font-semibold outline-none transition focus:border-[var(--color-brand)]"
            style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-sans)" }}
          />

          <button type="button" onClick={onSaveNickname} className="cta-btn cta-btn-primary w-full mb-2">
            확인
          </button>

          {editingNick && (
            <button
              type="button"
              onClick={() => { setEditingNick(false); setNickDraft(""); setError(null); }}
              className="cta-btn cta-btn-ghost w-full"
            >
              취소
            </button>
          )}

          {error && (
            <p className="mt-4 rounded-lg px-3 py-2 text-center text-sm" style={{ background: "#fef2f2", color: "#b91c1c" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const onCodeJoin = () => {
    const normalized = normalizeRoomCode(code);
    if (!normalized) {
      setError("4자리 코드를 정확히 입력해주세요");
      return;
    }
    void joinExisting(normalized);
  };

  /* ── 대시보드 ── */
  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: "var(--brand-grad)" }}
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between px-8 py-4 flex-shrink-0" style={glassHeader}>
        <div>
          <span className="block text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
            카드게임
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
            PvP 대전 모드
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {busy && (
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              처리 중…
            </span>
          )}
          <div className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={glassChip}>
            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
              내 닉네임
            </span>
            <span className="font-bold text-white text-sm">{nickname}</span>
            <button
              type="button"
              onClick={() => { setNickDraft(nickname); setEditingNick(true); setError(null); }}
              className="text-xs font-bold rounded-lg px-2.5 py-1 transition"
              style={{ background: "rgba(255,255,255,0.18)", color: "white" }}
            >
              변경
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="flex-1 grid gap-5 p-5 overflow-hidden" style={{ gridTemplateColumns: "minmax(280px,1fr) 2fr" }}>

        {/* 좌측 패널 — 방 만들기 · 코드 입장 */}
        <div className="surface-card flex flex-col p-7 overflow-hidden">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--color-text)" }}>
              새 방 만들기
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              최대 4명 · 빈 자리는 NPC가 채워요
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void hostNew()}
            className="cta-btn cta-btn-primary cta-btn-large w-full mb-6"
          >
            ＋ 방 만들기
          </button>

          <div
            className="flex-1 flex flex-col"
            style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "1.5rem" }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text)" }}>
              코드로 직접 입장
            </h2>

            {!showCodeInput ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => { setError(null); setShowCodeInput(true); }}
                className="w-full rounded-xl py-3 text-sm font-semibold transition border-2 border-dashed hover:border-[var(--color-brand)]"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                방 코드 입력하기
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  autoFocus
                  placeholder="예: A3F7"
                  onKeyDown={(e) => { if (e.key === "Enter") onCodeJoin(); }}
                  className="w-full rounded-xl border-2 bg-white px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.25em] uppercase outline-none transition focus:border-[var(--color-brand)]"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onCodeJoin}
                    className="cta-btn cta-btn-primary flex-1 disabled:opacity-50"
                  >
                    입장
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setShowCodeInput(false); setCode(""); setError(null); }}
                    className="cta-btn cta-btn-ghost disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg px-3 py-2.5 text-center text-sm" style={{ background: "#fef2f2", color: "#b91c1c" }}>
              {error}
            </p>
          )}
        </div>

        {/* 우측 패널 — 열린 방 목록 */}
        <div className="surface-card flex flex-col p-7 overflow-hidden">
          <div className="mb-5 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-extrabold" style={{ color: "var(--color-text)" }}>
              열린 방
            </h2>
            {openRooms.length > 0 && (
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
              >
                {openRooms.length}개 모집 중
              </span>
            )}
          </div>

          {openRooms.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed gap-3"
              style={{ borderColor: "var(--color-border)", background: "var(--color-board-soft)" }}
            >
              <span className="text-5xl" aria-hidden>🎮</span>
              <p className="font-bold text-sm" style={{ color: "var(--color-text-muted)" }}>
                아직 열린 방이 없어요
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)", opacity: 0.7 }}>
                직접 방을 만들거나 친구를 기다려보세요
              </p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto space-y-3 pr-1">
              {openRooms.map((r) => {
                const filledSlots = r.slotCount;
                const npc = Math.max(0, 4 - filledSlots);
                return (
                  <li key={r.code}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void joinExisting(r.code)}
                      className="w-full text-left rounded-2xl px-6 py-5 flex items-center justify-between gap-6 transition disabled:opacity-50 hover:border-[var(--color-action-cyan)] hover:bg-[var(--color-brand-soft)]"
                      style={{
                        background: "var(--color-board-soft)",
                        border: "1.5px solid var(--color-divider)",
                      }}
                    >
                      <div>
                        <span
                          className="font-mono text-3xl font-bold tracking-[0.22em] block"
                          style={{ color: "var(--color-text)" }}
                        >
                          {r.code}
                        </span>
                        <span className="text-xs mt-1 block" style={{ color: "var(--color-text-muted)" }}>
                          {formatAge(r.createdAt)} 생성
                        </span>
                      </div>

                      <div className="flex items-center gap-5">
                        {/* 슬롯 점 표시 */}
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-3.5 h-3.5 rounded-full transition-colors"
                              style={{
                                background: i < filledSlots
                                  ? "var(--color-action-cyan)"
                                  : "var(--color-border)",
                              }}
                            />
                          ))}
                        </div>

                        <div className="text-right">
                          <span
                            className="text-lg font-extrabold block"
                            style={{ color: "var(--color-action-cyan)" }}
                          >
                            {filledSlots}/4명
                          </span>
                          {npc > 0 && (
                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                              NPC {npc}명
                            </span>
                          )}
                        </div>

                        <div
                          className="cta-btn cta-btn-primary pointer-events-none"
                          style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}
                        >
                          입장
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
