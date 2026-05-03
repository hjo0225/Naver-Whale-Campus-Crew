"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { CARD_TYPES, CHAR_IMAGES, LLAMA_CARD } from "@/lib/game/data";
import { SLIDE_DURATION_MS, SLIDE_PATTERN } from "@/lib/config";
import { Card } from "@/components/game/Card";
import { FullPageSlider } from "@/components/ui/FullPageSlider";
import { useGameStore } from "@/lib/store/gameStore";
import type { CharKey } from "@/lib/game/types";

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
    desc: "브라우저 옆에 학습·검색·번역 도구가 한 번에. 페이지를 이리저리 옮기지 않고 한 화면에서 작업해요",
    tags: ["바로가기", "번역", "검색"],
    scenario: "강의 자료 보면서 동시에 단어 검색·번역 · 발표 자료 만들면서 자료 정리",
  },
  {
    eyebrow: "기능 02",
    title: "웨일 스페이스",
    desc: "탭 그룹으로 작업·공부·취미를 따로 관리. 여러 프로필을 한 창에서 전환하고 클라우드 동기화로 어디서나 동일한 환경",
    tags: ["탭 그룹", "멀티 프로필", "동기화"],
    scenario: "학교 / 알바 / 사이드 프로젝트 탭 분리 · 노트북·데스크탑 같은 환경 유지",
  },
  {
    eyebrow: "기능 03",
    title: "웨일온",
    desc: "설치 없이 브라우저에서 바로 화상회의. 시간 제한 없이 무료로 사용 가능하고 화면 공유·녹화·자막까지 한 번에",
    tags: ["설치 불필요", "무료", "화면 공유"],
    scenario: "팀플 발표 연습 · 온라인 스터디 · 멀리 있는 친구와 게임 같이 보기",
  },
  {
    eyebrow: "기능 04",
    title: "그린드랍",
    desc: "모바일과 PC 사이에 사진·파일·URL을 한 번의 탭으로 전송. 메신저를 거치지 않고 직접 보내고 받을 수 있어요",
    tags: ["파일 전송", "URL 공유", "크로스 디바이스"],
    scenario: "폰으로 찍은 사진 PC로 즉시 전송 · 모바일에서 본 페이지 PC로 이어보기",
  },
  {
    eyebrow: "기능 05 · NEW",
    title: "멀티플레이",
    desc: "친구들과 같은 탭을 실시간으로 보며 음성으로 대화하는 협업 공간. 링크 하나로 초대해 함께 검색하고 함께 탐색해요",
    tags: ["실시간 탭 공유", "음성 채팅", "팔로우 · 스포트라이트"],
    scenario: "조모임 자료 같이 찾기 · 친구와 같은 페이지 보면서 통화 · 발표 리허설",
  },
] as const;

const HEADER_FRIENDS_ORDER: CharKey[] = [
  "byul_e",
  "dalto",
  "naver_whale",
  "ghost_whale",
  "pepo",
];

function QRPanel() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-[320px] h-[320px] bg-white rounded-3xl flex items-center justify-center overflow-hidden shadow-[0_16px_48px_rgba(0,22,60,0.3)]">
        <img
          src="/qr.png"
          alt="부스 QR 코드"
          className="w-full h-full object-contain p-4"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
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
        <h1 className="display-h1 mt-6 mb-5">
          네이버 웨일과 함께하는
          <br />
          <span className="text-(--color-brand-cyan)">캠퍼스 부스</span>
        </h1>
        <p className="text-xl text-[#C9D3DD] mb-10">함께하면 더 즐거운 한 판</p>
        <div className="flex gap-4 mb-12">
          {HEADER_FRIENDS_ORDER.map((c) => (
            <img
              key={c}
              src={CHAR_IMAGES[c]}
              alt={c}
              className="w-24 h-24 rounded-full bg-white/10 object-cover"
            />
          ))}
        </div>
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
          className="cta-btn cta-btn-primary cta-btn-pill !bg-white !text-(--color-brand-deep)"
        >
          싱글 플레이 ▶
        </Link>
        {/* PvP 대전 진입 — RTDB 셋업/부스 운영 정리 후 다시 노출.
        <Link
          href="/game/pvp/"
          className="cta-btn cta-btn-pill !bg-(--color-brand-cyan) !text-white"
        >
          🤝 PvP 대전 (노트북 2대)
        </Link>
        */}
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
