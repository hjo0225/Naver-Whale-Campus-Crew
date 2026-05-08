"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { CARD_TYPES, LLAMA_CARD } from "@/lib/game/data";
import { Card, CardBack } from "@/components/game/Card";
import { FullPageSlider } from "@/components/ui/FullPageSlider";

export function Rule01Page() {
  return (
    <div className="text-center max-w-[1200px] mx-auto">
      <span className="eyebrow mb-5">RULE 01 · 카드 종류</span>
      <h2 className="display-h2 mt-4 mb-5">카드는 6종류</h2>
      <p className="text-base sm:text-lg text-(--color-text-secondary) mb-10">
        1~5 숫자 카드와 캐릭6(라마) 카드. 마지막에 손에 들고 있으면{" "}
        <strong className="text-(--color-text)">그 점수만큼 깎입니다</strong>.
      </p>
      <div className="flex flex-wrap gap-5 justify-center mb-8">
        {CARD_TYPES.map((c) => (
          <div key={String(c.id)} className="flex flex-col items-center gap-3">
            <Card card={c} size="xl" />
            <span className="text-base font-bold text-(--color-text-secondary)">
              -{c.points}점
            </span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-3">
          <Card card={LLAMA_CARD} size="xl" />
          <span className="text-base font-bold text-(--color-llama-text)">
            -{LLAMA_CARD.points}점
          </span>
        </div>
      </div>
      <p className="text-(--color-text-secondary)">
        캐릭6(라마)는 <strong>-8점 폭탄</strong>! 빨리 던지는 게 좋아요
      </p>
    </div>
  );
}

export function Rule02Page() {
  return (
    <div className="text-center max-w-[1200px] mx-auto">
      <span className="eyebrow mb-5">RULE 02 · 매칭 규칙</span>
      <h2 className="display-h2 mt-4 mb-5">같은 숫자 또는 +1만</h2>
      <p className="text-base sm:text-lg text-(--color-text-secondary) mb-10">
        바닥에 놓인 카드와{" "}
        <strong className="text-(--color-text)">같은 숫자나 한 칸 위 숫자만</strong> 낼 수 있어요.
      </p>

      <div className="flex items-center justify-center gap-10 flex-wrap">
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold text-(--color-text-muted) mb-2">바닥에 캐릭3이 있다면</div>
          <Card card={CARD_TYPES[2]!} size="xl" />
        </div>
        <div className="text-6xl text-(--color-text-muted) font-bold">→</div>
        <div className="grid gap-6">
          <div className="flex items-center gap-5">
            <span className="font-bold text-green-600 text-xl w-24 text-left">✓ 가능</span>
            <Card card={CARD_TYPES[2]!} size="xl" />
            <Card card={CARD_TYPES[3]!} size="xl" />
          </div>
          <div className="flex items-center gap-5">
            <span className="font-bold text-red-500 text-xl w-24 text-left">✗ 불가</span>
            <Card card={CARD_TYPES[0]!} size="xl" faded />
            <Card card={CARD_TYPES[1]!} size="xl" faded />
            <Card card={CARD_TYPES[4]!} size="xl" faded />
          </div>
        </div>
      </div>

      <p className="text-(--color-text-secondary) mt-8">
        <strong>5 위에는 캐릭6(라마)</strong>, <strong>캐릭6 위에는 1</strong>만 가능
      </p>
    </div>
  );
}

export function Rule03Page() {
  return (
    <div className="text-center max-w-[1200px] mx-auto">
      <span className="eyebrow mb-5">RULE 03 · 차례 행동</span>
      <h2 className="display-h2 mt-4 mb-5">내 차례에 3가지 선택</h2>
      <p className="text-base sm:text-lg text-(--color-text-secondary) mb-10">
        매 차례 <strong className="text-(--color-text)">셋 중 하나</strong>를 골라야 해요.
      </p>

      <div className="grid sm:grid-cols-3 gap-5 max-w-[860px] mx-auto">
        {(
          [
            {
              n: "1",
              visual: <Card card={CARD_TYPES[2]!} size="xl" />,
              t: "카드 내기",
              d: "매칭되는 카드를 골라 바닥에 내기",
            },
            {
              n: "2",
              visual: <CardBack size="xl" />,
              t: "카드 뽑기",
              d: "덱에서 1장 뽑고 차례 종료",
            },
            {
              n: "3",
              visual: (
                <span className="text-8xl leading-none" aria-hidden>
                  ✋
                </span>
              ),
              t: "그만하기",
              d: "이 라운드 이탈, 손에 든 카드로 점수 확정",
            },
          ] as ReadonlyArray<{ n: string; visual: ReactNode; t: string; d: string }>
        ).map((a) => (
          <div
            key={a.t}
            className="surface-card flex flex-col items-center text-center px-6 py-7 gap-2"
          >
            <span className="text-xs font-bold tracking-[0.14em] text-(--color-brand-cyan)">
              STEP {a.n}
            </span>
            <div className="my-2 flex items-center justify-center min-h-[244px]">
              {a.visual}
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">{a.t}</h3>
            <p className="text-(--color-text-secondary) text-sm leading-relaxed">{a.d}</p>
          </div>
        ))}
      </div>

      <p className="text-(--color-text-secondary) mt-8">
        못 내겠으면 <strong>뽑거나 그만하기</strong>를 선택
      </p>

      <div className="surface-card muted mt-6 inline-flex items-center gap-3 text-left text-base text-(--color-text-secondary) px-5 py-3">
        <span className="text-xs font-bold tracking-[0.12em] text-(--color-brand) shrink-0">예외</span>
        <span>
          <strong className="text-(--color-text)">다른 사람이 모두 그만하면 뽑기 불가</strong>
          <br />— 낼 카드만 내거나 그만하세요
        </span>
      </div>
    </div>
  );
}

export function Rule04Page() {
  return (
    <div className="text-center max-w-[1200px] mx-auto">
      <span className="eyebrow mb-5">RULE 04 · 점수 계산</span>
      <h2 className="display-h2 mt-4 mb-5">카드를 빨리 털어내세요</h2>
      <p className="text-base sm:text-lg text-(--color-text-secondary) mb-10">
        라운드 끝에 손에 남은 카드만큼{" "}
        <strong className="text-(--color-text)">점수가 깎입니다</strong>. 0장이면 페널티 없음,
        라마(8점)는 가장 무거운 폭탄.
      </p>
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        <Card card={CARD_TYPES[0]!} size="xl" />
        <Card card={CARD_TYPES[3]!} size="xl" />
        <Card card={CARD_TYPES[3]!} size="xl" />
        <Card card={LLAMA_CARD} size="xl" />
      </div>
      <p className="text-(--color-text-secondary) mb-2">
        예시 손패: 1 + 4 + (4 중복은 미카운트) + 8 ={" "}
        <strong className="text-(--color-text)">−13점 차감</strong>
      </p>
      <p className="text-sm text-(--color-text-muted)">
        ※ 같은 카드를 여러 장 들고 있어도 1번만 차감
      </p>
    </div>
  );
}

export function Rule05Page({
  showStartButton = true,
  startHref = "/game/",
  startLabel = "게임 시작하기 →",
  pvp = false,
}: {
  showStartButton?: boolean;
  startHref?: string;
  startLabel?: string;
  pvp?: boolean;
} = {}) {
  return (
    <div className="text-center max-w-[1200px] mx-auto">
      <span className="eyebrow mb-5">RULE 05 · 승리 조건</span>
      <h2 className="display-h2 mt-4 mb-5">네 명이 모여서 한 판</h2>
      <p className="text-base sm:text-lg text-(--color-text-secondary) mb-8">
        {pvp ? (
          <>
            방에 참가한 <strong className="text-(--color-text)">사람들</strong>과 한 테이블에서 한 판.
            빈 자리는 웨일프렌즈 NPC가 채워요.
          </>
        ) : (
          <>
            손님 + 웨일프렌즈 <strong className="text-(--color-text)">3명</strong>이 한 테이블에서 한 판.
          </>
        )}{" "}
        손에 남은 카드 점수가{" "}
        <strong className="text-(--color-text)">가장 낮은 사람이 1등!</strong>
      </p>

      <div className="grid sm:grid-cols-3 gap-6 max-w-[1100px] mx-auto mb-12">
        <div className="surface-card accent text-left px-7 py-8">
          <div className="text-sm font-bold tracking-[0.12em] text-(--color-accent-deep) mb-3">
            1등
          </div>
          <div className="font-extrabold text-2xl mb-2">최고 상품</div>
          <p className="text-base text-(--color-text-secondary)">
            키캡 + 인형 <strong className="text-(--color-text)">둘 다</strong>
          </p>
        </div>
        <div className="surface-card text-left px-7 py-8">
          <div className="text-sm font-bold tracking-[0.12em] text-(--color-text-muted) mb-3">
            2 · 3등
          </div>
          <div className="font-extrabold text-2xl mb-2">기념 상품</div>
          <p className="text-base text-(--color-text-secondary)">
            키캡 또는 인형 중 <strong className="text-(--color-text)">1개 택1</strong>
          </p>
        </div>
        <div className="surface-card muted text-left px-7 py-8">
          <div className="text-sm font-bold tracking-[0.12em] text-(--color-text-muted) mb-3">
            4등
          </div>
          <div className="font-extrabold text-2xl mb-2">꽝</div>
          <p className="text-base text-(--color-text-secondary)">다음에 또 도전해주세요!</p>
        </div>
      </div>

      <p className={`text-base text-(--color-text-muted) ${showStartButton ? "mb-8" : ""}`}>
        부스에서 운영진 안내에 따라 게임을 시작하세요
      </p>

      {showStartButton && (
        <Link href={startHref} className="cta-btn cta-btn-primary cta-btn-pill">
          {startLabel}
        </Link>
      )}
    </div>
  );
}

export function RulesScreen() {
  const pages = useMemo(
    () => [
      <Rule01Page key="r1" />,
      <Rule02Page key="r2" />,
      <Rule03Page key="r3" />,
      <Rule04Page key="r4" />,
      <Rule05Page key="r5" />,
    ],
    [],
  );

  return <FullPageSlider pages={pages} mode="wheel" variant="light" />;
}

/** PvP 모드 진입 전 룰 설명 — 마지막 페이지에서 PvP 로비로 이동. */
export function PvpRulesScreen() {
  const pages = useMemo(
    () => [
      <Rule01Page key="r1" />,
      <Rule02Page key="r2" />,
      <Rule03Page key="r3" />,
      <Rule04Page key="r4" />,
      <Rule05Page
        key="r5"
        startHref="/game/pvp/"
        startLabel="로비 입장 →"
        pvp
      />,
    ],
    [],
  );

  return <FullPageSlider pages={pages} mode="wheel" variant="light" />;
}
