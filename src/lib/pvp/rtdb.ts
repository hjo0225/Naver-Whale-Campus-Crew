"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  runTransaction,
  serverTimestamp,
  push,
  onDisconnect,
  type Database,
  type DataSnapshot,
} from "firebase/database";

import type { Room, RoomState, ActionEnvelope, SlotKey } from "./schema";
import { generateRoomCode } from "./roomCode";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.databaseURL && config.projectId);
}

function ensureApp(): FirebaseApp {
  if (app) return app;
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase 환경변수가 비어있습니다. .env.local 에 NEXT_PUBLIC_FIREBASE_* 설정 후 다시 시도하세요."
    );
  }
  app = getApps()[0] ?? initializeApp(config as Record<string, string>);
  return app;
}

export function getDb(): Database {
  if (db) return db;
  db = getDatabase(ensureApp());
  return db;
}

export function getFbAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(ensureApp());
  return auth;
}

/** 익명 로그인 → uid 반환. 이미 로그인돼 있으면 즉시 반환. */
export async function ensureAnonAuth(): Promise<string> {
  const a = getFbAuth();
  if (a.currentUser) return a.currentUser.uid;
  const cred = await signInAnonymously(a);
  return cred.user.uid;
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFbAuth(), cb);
}

/** ===== Room CRUD ===== */

export function roomRef(code: string) {
  return ref(getDb(), `rooms/${code}`);
}

export function watchRoom(code: string, cb: (room: Room | null) => void): () => void {
  const r = roomRef(code);
  const unsub = onValue(r, (snap: DataSnapshot) => {
    cb(snap.exists() ? (snap.val() as Room) : null);
  });
  return unsub;
}

/**
 * 방 생성 — transaction으로 코드 충돌 방지. 최대 5회 재시도.
 * 성공 시 점유한 코드 반환.
 */
export async function createRoom(uid: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const result = await runTransaction(roomRef(code), (current) => {
      if (current) return; // 충돌 — abort
      return {
        meta: {
          createdAt: Date.now(),
          hostUid: uid,
          status: "waiting",
        },
        slots: {
          p0: { uid, joinedAt: Date.now() },
        },
      };
    });
    if (result.committed) return code;
  }
  throw new Error("방 코드를 생성하지 못했습니다 (5회 재시도 실패)");
}

/** 게스트가 방에 입장. 빈 슬롯이 있으면 점유, 없으면 throw. */
export async function joinRoom(code: string, uid: string): Promise<void> {
  const slotsRef = ref(getDb(), `rooms/${code}/slots/p1`);
  const result = await runTransaction(slotsRef, (current) => {
    if (current) return; // 이미 점유됨 — abort
    return { uid, joinedAt: Date.now() };
  });
  if (!result.committed) {
    // 방 자체가 없는지 / 슬롯이 차있는지 구분
    const r = roomRef(code);
    const snap = await new Promise<DataSnapshot>((resolve) => {
      onValue(r, resolve, { onlyOnce: true });
    });
    if (!snap.exists()) throw new Error("존재하지 않는 방 코드입니다");
    throw new Error("방이 이미 가득 찼습니다");
  }
}

/** 호스트만 호출. 전체 state 덮어쓰기. */
export async function writeState(code: string, state: RoomState): Promise<void> {
  await set(ref(getDb(), `rooms/${code}/state`), state);
}

/** 호스트만 호출. status 갱신. */
export async function setStatus(code: string, status: Room["meta"]["status"]): Promise<void> {
  await update(ref(getDb(), `rooms/${code}/meta`), { status });
}

/** 양쪽 모두 호출 가능. 자기 액션을 큐에 push. */
export async function pushAction(code: string, action: ActionEnvelope): Promise<void> {
  await push(ref(getDb(), `rooms/${code}/actions`), action);
}

/** 호스트가 consume 후 큐 비우기. */
export async function clearActions(code: string): Promise<void> {
  await remove(ref(getDb(), `rooms/${code}/actions`));
}

/** presence 등록 + onDisconnect로 자동 offline. */
export async function registerPresence(code: string, uid: string): Promise<void> {
  const pRef = ref(getDb(), `rooms/${code}/presence/${uid}`);
  await set(pRef, { online: true, lastSeen: serverTimestamp() });
  await onDisconnect(pRef).set({ online: false, lastSeen: serverTimestamp() });
}

/** 운영진이 방을 닫을 때 (또는 cleanup). */
export async function deleteRoom(code: string): Promise<void> {
  await remove(roomRef(code));
}

export function slotKeyForUid(room: Room | null, uid: string): SlotKey | null {
  if (!room) return null;
  if (room.slots?.p0?.uid === uid) return "p0";
  if (room.slots?.p1?.uid === uid) return "p1";
  return null;
}
