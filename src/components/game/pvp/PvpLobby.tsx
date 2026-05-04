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

const brandBg: React.CSSProperties = {
  background: "var(--brand-grad)",
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

  if (showNicknameGate) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={brandBg}
      >
        <div className="surface-card w-full max-w-sm" style={{ padding: "2rem" }}>
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

          <button
            type="button"
            onClick={onSaveNickname}
            className="cta-btn cta-btn-primary w-full mb-2"
          >
            확인
          </button>

          {editingNick && (
            <button
              type="button"
              onClick={() => {
                setEditingNick(false);
                setNickDraft("");
                setError(null);
              }}
              className="cta-btn cta-btn-ghost w-full"
            >
              취소
            </button>
          )}

          {error && (
            <p
              className="mt-4 rounded-lg px-3 py-2 text-center text-sm"
              style={{ background: "#fef2f2", color: "#b91c1c" }}
            >
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

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={brandBg}
    >
      <div className="surface-card w-full max-w-md" style={{ padding: "2rem" }}>
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="eyebrow block mb-1">카드게임</span>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              PvP 대전 모드
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              최대 4명 — 빈 자리는 NPC가 채워요
            </p>
          </div>

          {/* 닉네임 칩 */}
          <div
            className="rounded-xl px-3 py-2 text-right flex-shrink-0 ml-4"
            style={{
              background: "var(--color-board-soft)",
              border: "1px solid var(--color-divider)",
            }}
          >
            <div
              className="text-xs font-semibold mb-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              내 닉네임
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
                {nickname}
              </span>
              <button
                type="button"
                onClick={() => {
                  setNickDraft(nickname);
                  setEditingNick(true);
                  setError(null);
                }}
                className="text-xs font-semibold rounded-md px-2 py-0.5 transition"
                style={{
                  background: "white",
                  color: "var(--color-brand)",
                  border: "1px solid var(--color-border)",
                }}
              >
                변경
              </button>
            </div>
          </div>
        </div>

        {/* 방 만들기 */}
        <button
          type="button"
          disabled={busy}
          onClick={() => void hostNew()}
          className="cta-btn cta-btn-primary w-full mb-5"
        >
          ＋ 방 만들기
        </button>

        {/* 열린 방 목록 */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            열린 방
          </h2>
          {openRooms.length > 0 && (
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {openRooms.length}개 모집중
            </span>
          )}
        </div>

        {openRooms.length === 0 ? (
          <div
            className="mb-5 rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
              background: "var(--color-board-soft)",
            }}
          >
            아직 열린 방이 없어요
            <br />
            <span className="text-xs opacity-70">
              직접 방을 만들거나 친구를 기다려보세요
            </span>
          </div>
        ) : (
          <ul className="mb-5 space-y-2">
            {openRooms.map((r) => {
              const npc = Math.max(0, 4 - r.slotCount);
              return (
                <li key={r.code}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void joinExisting(r.code)}
                    className="w-full text-left transition rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-[var(--color-action-cyan)] hover:bg-[var(--color-brand-soft)] disabled:opacity-50"
                    style={{
                      background: "var(--color-board-soft)",
                      border: "1.5px solid var(--color-divider)",
                    }}
                  >
                    <div className="flex flex-col">
                      <span
                        className="font-mono text-lg font-bold tracking-[0.18em]"
                        style={{ color: "var(--color-text)" }}
                      >
                        {r.code}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {formatAge(r.createdAt)} 생성
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--color-action-cyan)" }}
                      >
                        {r.slotCount}/4명
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        NPC {npc}명
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* 코드 직접 입장 */}
        <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "1rem" }}>
          {!showCodeInput ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError(null);
                setShowCodeInput(true);
              }}
              className="w-full rounded-xl py-2 text-sm font-semibold transition hover:text-[var(--color-brand)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              코드로 직접 입장
            </button>
          ) : (
            <div className="space-y-2">
              <label
                className="block text-xs font-bold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                4자리 방 코드
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
                placeholder="예: A3F7"
                className="w-full rounded-xl border-2 bg-white px-3 py-2 text-center text-xl font-mono font-bold tracking-widest uppercase outline-none transition focus:border-[var(--color-brand)]"
                style={{ borderColor: "var(--color-border)" }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCodeJoin}
                  className="cta-btn cta-btn-primary flex-1 disabled:opacity-50"
                  style={{ borderRadius: "var(--radius-md)", padding: "0.65rem 1rem" }}
                >
                  입장
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setShowCodeInput(false);
                    setCode("");
                    setError(null);
                  }}
                  className="cta-btn cta-btn-ghost disabled:opacity-50"
                  style={{ borderRadius: "var(--radius-md)", padding: "0.65rem 1rem" }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p
            className="mt-4 rounded-lg px-3 py-2 text-center text-sm"
            style={{ background: "#fef2f2", color: "#b91c1c" }}
          >
            {error}
          </p>
        )}
        {busy && (
          <p className="mt-4 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            처리 중…
          </p>
        )}
      </div>
    </div>
  );
}
