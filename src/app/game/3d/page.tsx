import Link from "next/link";

/**
 * Phase 2 placeholder.
 * 실제 three.js / R3F 구현은 별도 PR에서 추가합니다.
 */
export default function Game3DPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-8 text-center">
      <div className="max-w-[600px]">
        <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
          PHASE 2
        </span>
        <h1 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
          3D 카드게임 (작업 중)
        </h1>
        <p className="text-lg text-(--color-text-secondary) mb-8">
          three.js + React Three Fiber로 구현 예정.
          <br />
          현재는 2D 버전(<Link href="/game/" className="text-(--color-brand) underline">/game</Link>
          )을 사용해주세요.
        </p>
        <Link href="/" className="btn btn-secondary">
          홈으로
        </Link>
      </div>
    </div>
  );
}
