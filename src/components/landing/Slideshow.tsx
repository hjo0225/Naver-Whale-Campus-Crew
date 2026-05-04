"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { CARD_TYPES, LLAMA_CARD } from "@/lib/game/data";
import { SLIDE_DURATION_MS, SLIDE_PATTERN } from "@/lib/config";
import { Card } from "@/components/game/Card";
import { FullPageSlider } from "@/components/ui/FullPageSlider";
import { useGameStore } from "@/lib/store/gameStore";

interface FeatureSlide {
  eyebrow: string;
  title: string;
  desc: string;
  tags: readonly string[];
  scenario: string;
}

const FEATURE_SLIDES: readonly FeatureSlide[] = [
  {
    eyebrow: "기능 01",
    title: "사이드바",
    desc: "브라우저 옆 독립 영역에 즐겨찾기·파파고 번역·계산기·뮤직·확장앱을 모아두고, 메인 페이지를 보면서 동시에 사용해요",
    tags: ["바로가기", "파파고 번역", "확장앱"],
    scenario: "강의 자료 보면서 동시에 단어 검색·번역 · 발표 자료 만들면서 자료 정리",
  },
  {
    eyebrow: "기능 02",
    title: "퀵서치",
    desc: "단어를 드래그하면 그 자리에 작은 팝업으로 검색·파파고 번역 결과가 떠요. 페이지를 떠나지 않고 바로 확인",
    tags: ["드래그 검색", "팝업", "파파고"],
    scenario: "PDF 보다가 모르는 단어 즉시 검색 · 외국어 자료 빠르게 번역",
  },
  {
    eyebrow: "기능 03",
    title: "멀티검색",
    desc: "한 번 입력하면 네이버·구글·다음 등 여러 검색엔진 결과를 한 화면에 나란히. 출처별 결과를 동시에 비교해요",
    tags: ["동시 검색", "엔진 비교", "AI 검색"],
    scenario: "과제 자료 다양한 출처로 빠르게 비교 · 같은 키워드 다른 결과 한눈에",
  },
  {
    eyebrow: "기능 04",
    title: "듀얼탭",
    desc: "한 창을 두 화면으로 분할. 왼쪽에서 누른 링크가 오른쪽에 열려서, 목록과 본문을 동시에 보면서 작업해요",
    tags: ["화면 분할", "한 창 두 탭", "Ctrl+Shift+S"],
    scenario: "강의 영상 보면서 노트 정리 · 두 자료 비교하면서 정리",
  },
] as const;

function QRPanel() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-[320px] h-[320px] bg-white rounded-3xl flex items-center justify-center overflow-hidden shadow-[0_16px_48px_rgba(0,22,60,0.3)]">
        <img
          src="/qr.png?v=1"
          alt="부스 QR 코드"
          className="w-full h-full object-contain p-4"
        />
      </div>
    </div>
  );
}

function IntroSlide() {
  return (
    <div className="w-full grid md:grid-cols-[1.4fr_1fr] gap-20 items-center">
      <div className="text-left">
        <span className="eyebrow mb-8">WHALE BOOTH</span>
        <h1 className="display-h1 mt-6 mb-10 sm:mb-12">
          네이버 웨일과 함께하는
          <br />
          <span className="text-(--color-brand-cyan)">캠퍼스 부스</span>
        </h1>
        <Link
          href="/conditions/"
          className="cta-btn cta-btn-primary cta-btn-pill !bg-white !text-(--color-brand-deep)"
        >
          참가 방법 보기 →
        </Link>
      </div>
      <QRPanel />
    </div>
  );
}

function FeatureSlideView({ f }: { f: FeatureSlide }) {
  return (
    <div className="w-full grid md:grid-cols-[1fr_1.15fr] gap-16 items-center">
      <div className="text-left">
        <span className="eyebrow mb-6">{f.eyebrow}</span>
        <h1 className="display-h1 mt-6 mb-6">{f.title}</h1>
        <p className="text-xl text-[#C9D3DD] leading-relaxed mb-6">{f.desc}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {f.tags.map((t) => (
            <span
              key={t}
              className="text-sm px-3 py-1 border border-white/30 text-[#C9D3DD] rounded-full font-medium"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="pt-6 border-t border-white/20 text-lg text-[#C9D3DD] leading-relaxed">
          <strong className="text-(--color-brand-cyan)">이럴 때 좋아요</strong>
          <br />
          {f.scenario}
        </div>
      </div>
      <div className="aspect-[16/10] bg-white/5 border border-dashed border-white/30 rounded-2xl flex items-center justify-center text-[#C9D3DD] text-center p-8 text-lg">
        실제 사용 화면
        <br />({f.title} 스크린샷)
      </div>
    </div>
  );
}

function GameStartSlide() {
  const allCards = useMemo(() => [...CARD_TYPES, LLAMA_CARD], []);
  return (
    <div className="w-full text-center">
      <span className="eyebrow mb-8">WHALE BOOTH GAME</span>
      <h1 className="display-h1 mt-6 mb-6">
        웨일프렌즈와
        <br />
        <span className="text-(--color-brand-cyan)">한 판 어때?</span>
      </h1>
      <p className="text-2xl text-[#C9D3DD] mb-16">함께하면 더 즐거운 부스 게임</p>
      <div className="flex justify-center gap-3 mb-16 flex-wrap">
        {allCards.map((c) => (
          <Card key={String(c.id)} card={c} size="large" />
        ))}
      </div>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/rules/"
          className="cta-btn cta-btn-primary cta-btn-pill !bg-white !text-(--color-brand-deep) min-w-[220px] justify-center"
        >
          싱글 플레이 ▶
        </Link>
        <Link
          href="/game/pvp/rules/"
          className="cta-btn cta-btn-primary cta-btn-pill !bg-white !text-(--color-brand-deep) min-w-[220px] justify-center"
        >
          PvP 대전 ▶
        </Link>
      </div>
    </div>
  );
}

export function Slideshow() {
  const reset = useGameStore((s) => s.reset);

  // 홈 도착 시 게임 store 정리 — 결과 화면에서 "처음으로" 누른 뒤 stale 결과가 남지 않도록.
  useEffect(() => {
    reset();
  }, [reset]);

  const pages = useMemo(
    () => [
      <IntroSlide key="intro" />,
      ...FEATURE_SLIDES.map((f) => <FeatureSlideView key={f.title} f={f} />),
      <GameStartSlide key="game-start" />,
    ],
    [],
  );

  return (
    <div className="text-white">
      <FullPageSlider
        pages={pages}
        mode="auto"
        autoIntervalMs={SLIDE_DURATION_MS}
        pattern={SLIDE_PATTERN}
        variant="brand"
      />
    </div>
  );
}
