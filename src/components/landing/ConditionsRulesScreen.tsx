"use client";

import { useMemo, type ReactNode } from "react";
import { CARD_TYPES, LLAMA_CARD } from "@/lib/game/data";
import { Card, CardBack } from "@/components/game/Card";
import { FullPageSlider } from "@/components/ui/FullPageSlider";

/**
 * 모바일 우선 룰 슬라이더 — `/conditions/rules` 전용.
 * `RulesScreen`을 베이스로 카드 사이즈/헤딩/spacing을 한 단계 축소,
 * 마지막 페이지의 "게임 시작하기" 버튼 제거 (부스 PC가 아닌 손님 휴대폰 동선 가정).
 */

function CompactRule01() {
  return (
    <div className="text-center max-w-[560px] mx-auto px-4">
      <span className="eyebrow mb-3">RULE 01 · 카드 종류</span>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 mb-3">카드는 6종류</h2>
      <p className="text-sm sm:text-base text-(--color-text-secondary) mb-6">
        1~5 숫자 카드와 캐릭6(라마) 카드. 마지막에 손에 들고 있으면{" "}
        <strong className="text-(--color-text)">그 점수만큼 깎입니다</strong>.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-5">
        {CARD_TYPES.map((c) => (
          <div key={String(c.id)} className="flex flex-col items-center gap-1.5">
            <Card card={c} size="default" />
            <span className="text-xs font-bold text-(--color-text-secondary)">
              -{c.points}점
            </span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1.5">
          <Card card={LLAMA_CARD} size="default" />
          <span className="text-xs font-bold text-(--color-llama-text)">
            -{LLAMA_CARD.points}점
          </span>
        </div>
      </div>
      <p className="text-sm text-(--color-text-secondary)">
        캐릭6(라마)는 <strong>-8점 폭탄</strong>! 빨리 던지는 게 좋아요
      </p>
    </div>
  );
}

function CompactRule02() {
  return (
    <div className="text-center max-w-[560px] mx-auto px-4">
      <span className="eyebrow mb-3">RULE 02 · 매칭 규칙</span>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 mb-3">
        같은 숫자 또는 +1만
      </h2>
      <p className="text-sm sm:text-base text-(--color-text-secondary) mb-6">
        바닥에 놓인 카드와{" "}
        <strong className="text-(--color-text)">같은 숫자나 한 칸 위 숫자만</strong> 낼 수 있어요.
      </p>

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex flex-col items-center">
          <div className="text-xs font-bold text-(--color-text-muted) mb-1.5">
            바닥에 캐릭3이 있다면
          </div>
          <Card card={CARD_TYPES[2]!} size="default" />
        </div>
        <div className="text-2xl text-(--color-text-muted) font-bold leading-none">↓</div>
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-600 text-sm w-14 text-left">✓ 가능</span>
            <Card card={CARD_TYPES[2]!} size="default" />
            <Card card={CARD_TYPES[3]!} size="default" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-500 text-sm w-14 text-left">✗ 불가</span>
            <Card card={CARD_TYPES[0]!} size="default" faded />
            <Card card={CARD_TYPES[1]!} size="default" faded />
            <Card card={CARD_TYPES[4]!} size="default" faded />
          </div>
        </div>
      </div>

      <p className="text-sm text-(--color-text-secondary) mt-5">
        <strong>5 위에는 캐릭6(라마)</strong>, <strong>캐릭6 위에는 1</strong>만 가능
      </p>
    </div>
  );
}

function CompactRule03() {
  return (
    <div className="text-center max-w-[560px] mx-auto px-4">
      <span className="eyebrow mb-3">RULE 03 · 차례 행동</span>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 mb-3">
        내 차례에 3가지 선택
      </h2>
      <p className="text-sm sm:text-base text-(--color-text-secondary) mb-6">
        매 차례 <strong className="text-(--color-text)">셋 중 하나</strong>를 골라야 해요.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(
          [
            {
              n: "1",
              visual: <Card card={CARD_TYPES[2]!} size="default" />,
              t: "카드 내기",
              d: "매칭되는 카드를 골라 바닥에 내기",
            },
            {
              n: "2",
              visual: <CardBack size="default" />,
              t: "카드 뽑기",
              d: "덱에서 1장 뽑고 차례 종료",
            },
            {
              n: "3",
              visual: (
                <span className="text-5xl leading-none" aria-hidden>
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
            className="surface-card flex flex-col items-center text-center px-3 py-3 gap-1"
          >
            <span className="text-[10px] font-bold tracking-[0.14em] text-(--color-brand-cyan)">
              STEP {a.n}
            </span>
            <div className="my-1 flex items-center justify-center min-h-[124px]">
              {a.visual}
            </div>
            <h3 className="text-sm font-extrabold tracking-tight">{a.t}</h3>
            <p className="text-(--color-text-secondary) text-[11px] leading-relaxed">{a.d}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-(--color-text-secondary) mt-5">
        못 내겠으면 <strong>뽑거나 그만하기</strong>를 선택
      </p>

      <div className="surface-card muted mt-4 inline-flex items-center gap-2 text-left text-xs sm:text-sm text-(--color-text-secondary) px-4 py-2">
        <span className="text-[10px] font-bold tracking-[0.12em] text-(--color-brand) shrink-0">
          예외
        </span>
        <span>
          <strong className="text-(--color-text)">다른 사람이 모두 그만하면 뽑기 불가</strong>{" "}
          — 낼 카드만 내거나 그만하세요
        </span>
      </div>
    </div>
  );
}

function CompactRule04() {
  return (
    <div className="text-center max-w-[560px] mx-auto px-4">
      <span className="eyebrow mb-3">RULE 04 · 점수 계산</span>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 mb-3">
        카드를 빨리 털어내세요
      </h2>
      <p className="text-sm sm:text-base text-(--color-text-secondary) mb-6">
        라운드 끝에 손에 남은 카드만큼{" "}
        <strong className="text-(--color-text)">점수가 깎입니다</strong>. 0장이면 페널티 없음,
        라마(8점)는 가장 무거운 폭탄.
      </p>
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        <Card card={CARD_TYPES[0]!} size="large" />
        <Card card={CARD_TYPES[3]!} size="large" />
        <Card card={CARD_TYPES[3]!} size="large" />
        <Card card={LLAMA_CARD} size="large" />
      </div>
      <p className="text-sm text-(--color-text-secondary) mb-1">
        예시 손패: 1 + 4 + (4 중복은 미카운트) + 8 ={" "}
        <strong className="text-(--color-text)">−13점 차감</strong>
      </p>
      <p className="text-xs text-(--color-text-muted)">
        ※ 같은 카드를 여러 장 들고 있어도 1번만 차감
      </p>
    </div>
  );
}

function CompactRule05() {
  return (
    <div className="text-center max-w-[560px] mx-auto px-4">
      <span className="eyebrow mb-3">RULE 05 · 승리 조건</span>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 mb-3">
        네 명이 모여서 한 판
      </h2>
      <p className="text-sm sm:text-base text-(--color-text-secondary) mb-5">
        손님 + 웨일프렌즈 <strong className="text-(--color-text)">3명</strong>이 한 테이블에서 한 판.
        손에 남은 카드 점수가{" "}
        <strong className="text-(--color-text)">가장 낮은 사람이 1등!</strong>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="surface-card accent text-left px-5 py-5">
          <div className="text-[11px] font-bold tracking-[0.12em] text-(--color-accent-deep) mb-2">
            1등
          </div>
          <div className="font-extrabold text-lg mb-1">최고 상품</div>
          <p className="text-sm text-(--color-text-secondary)">
            키캡 + 인형 <strong className="text-(--color-text)">둘 다</strong>
          </p>
        </div>
        <div className="surface-card text-left px-5 py-5">
          <div className="text-[11px] font-bold tracking-[0.12em] text-(--color-text-muted) mb-2">
            2 · 3등
          </div>
          <div className="font-extrabold text-lg mb-1">기념 상품</div>
          <p className="text-sm text-(--color-text-secondary)">
            키캡 또는 인형 중 <strong className="text-(--color-text)">1개 택1</strong>
          </p>
        </div>
        <div className="surface-card muted text-left px-5 py-5">
          <div className="text-[11px] font-bold tracking-[0.12em] text-(--color-text-muted) mb-2">
            4등
          </div>
          <div className="font-extrabold text-lg mb-1">꽝</div>
          <p className="text-sm text-(--color-text-secondary)">다음에 또 도전해주세요!</p>
        </div>
      </div>

      <p className="text-sm text-(--color-text-muted)">
        부스에서 운영진 안내에 따라 게임을 시작하세요
      </p>
    </div>
  );
}

export function ConditionsRulesScreen() {
  const pages = useMemo(
    () => [
      <CompactRule01 key="r1" />,
      <CompactRule02 key="r2" />,
      <CompactRule03 key="r3" />,
      <CompactRule04 key="r4" />,
      <CompactRule05 key="r5" />,
    ],
    [],
  );

  return <FullPageSlider pages={pages} mode="wheel" variant="light" />;
}
