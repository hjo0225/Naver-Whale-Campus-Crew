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
  // SSR HTML과 첫 클라이언트 렌더가 일치해야 함 — mount 후에만 닉네임 게이트 분기.
  const [mounted, setMounted] = useState(false);

  // 마운트 후 localStorage 에서 닉네임 hydrate (SSR 시 nickname="" 유지).
  useEffect(() => {
    setMounted(true);
    if (!usePvpStore.getState().nickname) {
      const saved = loadStoredNickname();
      if (saved) setNickname(saved);
    }
  }, [setNickname]);

  // 닉네임 미설정이면 자동으로 입력 화면 표시 (mount 전에는 게이트 숨김).
  const nicknameMissing = mounted && !nickname;
  const showNicknameGate = nicknameMissing || editingNick;

  useEffect(() => {
    if (!mounted) return;
    if (nicknameMissing) return; // 닉네임 입력 전엔 로비 구독 안 함
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
      <div className="flex min-h-screen items-start justify-center bg-slate-900 px-4 py-10 sm:items-center">
        <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-2xl sm:p-8">
          <h1 className="mb-1 text-center text-2xl font-bold">닉네임 설정</h1>
          <p className="mb-6 text-center text-sm text-slate-600">
            보드에 표시될 이름이에요 (최대 {NICKNAME_MAX}자)
          </p>

          <input
            type="text"
            value={nickDraft}
            onChange={(e) => setNickDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveNickname();
            }}
            maxLength={NICKNAME_MAX * 3}
            autoFocus
            placeholder="예: 웨일맨"
            className="mb-4 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-center text-lg font-semibold outline-none focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={onSaveNickname}
            className="mb-2 w-full rounded-2xl bg-emerald-500 py-3 text-base font-bold text-white shadow-lg transition hover:bg-emerald-600"
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
              className="w-full rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              취소
            </button>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
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
    <div className="flex min-h-screen items-start justify-center bg-slate-900 px-4 py-10 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-2xl sm:p-8">
        <h1 className="mb-1 text-center text-2xl font-bold">PvP 대전 모드</h1>
        <p className="mb-4 text-center text-sm text-slate-600">
          최대 4명 — 빈 자리는 NPC가 채워요
        </p>

        <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-sm">
          <span className="text-slate-500">내 닉네임</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{nickname}</span>
            <button
              type="button"
              onClick={() => {
                setNickDraft(nickname);
                setEditingNick(true);
                setError(null);
              }}
              className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
            >
              변경
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void hostNew()}
          className="mb-5 w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-50"
        >
          ＋ 방 만들기
        </button>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">열린 방</h2>
          <span className="text-xs text-slate-500">
            {openRooms.length > 0 ? `${openRooms.length}개 모집중` : ""}
          </span>
        </div>

        {openRooms.length === 0 ? (
          <div className="mb-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            아직 열린 방이 없어요
            <br />
            <span className="text-xs text-slate-400">
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
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-400 hover:bg-sky-50 disabled:opacity-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-lg font-bold tracking-[0.18em] text-slate-800">
                        {r.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatAge(r.createdAt)} 생성
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-semibold text-emerald-600">
                        {r.slotCount}/4명
                      </span>
                      <span className="text-[11px] text-slate-400">
                        NPC {npc}명
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-slate-200 pt-4">
          {!showCodeInput ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError(null);
                setShowCodeInput(true);
              }}
              className="w-full rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:text-sky-600"
            >
              코드로 직접 입장
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                4자리 방 코드
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
                placeholder="예: A3F7"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-center text-xl font-mono font-bold tracking-widest uppercase outline-none focus:border-sky-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCodeJoin}
                  className="flex-1 rounded-xl bg-sky-500 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
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
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

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
