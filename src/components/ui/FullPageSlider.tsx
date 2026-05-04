"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Mode = "wheel" | "auto";

interface FullPageSliderProps {
  pages: ReactNode[];
  mode: Mode;
  /** mode="auto" 전용 — 다음 슬라이드까지 ms */
  autoIntervalMs?: number;
  /** mode="auto" 전용 — 슬라이드 표시 순서. 미지정 시 0..pages.length-1 순환 */
  pattern?: readonly number[];
  /** mode="wheel" 전용 — 휠 한 번 처리 후 추가 휠을 무시할 ms (default 500) */
  cooldownMs?: number;
  showDots?: boolean;
  variant?: "light" | "brand";
  className?: string;
}

const EASING = [0.22, 1, 0.36, 1] as const;
const TRANSITION = { duration: 0.45, ease: EASING };

/**
 * 풀페이지 휠/자동 전환 슬라이더.
 *
 * - wheel 모드: 마우스 휠 / 키보드 / 모바일 세로 스와이프 1회당 다음 슬라이드.
 *   cooldown 으로 두 칸 점프 방지. 미세한 트랙패드 노이즈(deltaY < 8) 컷.
 * - auto 모드: pattern 순서대로 setInterval 자동 전환 (Slideshow 호환).
 *
 * 우측 점 인디케이터는 데스크톱에서만 표시. 모바일에선 숨김.
 */
export function FullPageSlider({
  pages,
  mode,
  autoIntervalMs = 6000,
  pattern,
  cooldownMs = 500,
  showDots = true,
  variant = "light",
  className,
}: FullPageSliderProps) {
  const [index, setIndex] = useState<number>(() => pattern?.[0] ?? 0);
  const rootRef = useRef<HTMLDivElement>(null);
  // page-dots 표시 여부 — 모바일에선 숨김. 회전/창 크기 변경에도 동기화.
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // wheel 모드 — debounced 휠 / 키보드 / 터치 스와이프 핸들러 (cooldown 공유)
  useEffect(() => {
    if (mode !== "wheel") return;
    const el = rootRef.current;
    if (!el) return;

    let lockedUntil = 0;
    const advance = (dir: 1 | -1) => {
      const now = performance.now();
      if (now < lockedUntil) return;
      lockedUntil = now + cooldownMs;
      setIndex((i) => Math.max(0, Math.min(pages.length - 1, i + dir)));
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 8) return; // 트랙패드 노이즈 컷
      advance(e.deltaY > 0 ? 1 : -1);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // 입력 필드 포커스 중이면 무시
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        advance(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        advance(-1);
      }
    };

    // 모바일 — 세로 스와이프로 페이지 전환. 임계값 50px 미만은 의도 없는 탭으로 간주.
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const dy = touchStartY - endY; // 위로 스와이프 = 양수 → 다음
      if (Math.abs(dy) < 50) return;
      advance(dy > 0 ? 1 : -1);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [mode, cooldownMs, pages.length]);

  // auto 모드 — Slideshow 호환 setInterval
  useEffect(() => {
    if (mode !== "auto") return;
    const seq: readonly number[] =
      pattern ?? Array.from({ length: pages.length }, (_, i) => i);
    if (seq.length === 0) return;
    let p = 0;
    setIndex(seq[0]!);
    const id = setInterval(() => {
      p = (p + 1) % seq.length;
      setIndex(seq[p]!);
    }, autoIntervalMs);
    return () => clearInterval(id);
  }, [mode, pattern, autoIntervalMs, pages.length]);

  const safeIndex = Math.max(0, Math.min(pages.length - 1, index));

  return (
    <div
      ref={rootRef}
      className={cn(
        "fullpage",
        variant === "brand" && "fullpage--brand",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={safeIndex}
          className="fullpage-page"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={TRANSITION}
        >
          <div className="fullpage-inner">{pages[safeIndex]}</div>
        </motion.div>
      </AnimatePresence>

      {showDots && !isTouch && (
        <div className="page-dots" aria-hidden>
          {pages.map((_, i) => (
            <span key={i} className={cn(i === safeIndex && "active")} />
          ))}
        </div>
      )}
    </div>
  );
}
