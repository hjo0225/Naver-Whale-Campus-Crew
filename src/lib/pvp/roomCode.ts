/** 4자리 방 코드 — 혼동 문자(0/O/1/I) 제외한 32 chars. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LEN = 4;

function getRandomInts(n: number): number[] {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    const arr = new Uint32Array(n);
    c.getRandomValues(arr);
    return Array.from(arr);
  }
  return Array.from({ length: n }, () => Math.floor(Math.random() * 0xffffffff));
}

export function generateRoomCode(): string {
  const nums = getRandomInts(CODE_LEN);
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[nums[i]! % ALPHABET.length];
  }
  return out;
}

/** 사용자 입력 정규화 — 공백/소문자 허용, 길이 검증. */
export function normalizeRoomCode(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== CODE_LEN) return null;
  for (const ch of cleaned) {
    if (!ALPHABET.includes(ch)) return null;
  }
  return cleaned;
}
