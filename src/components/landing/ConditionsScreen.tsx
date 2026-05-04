"use client";

import Link from "next/link";
import { useMemo } from "react";
import { APP_DOWNLOAD, REFERRAL_CODE } from "@/lib/config";
import { useGameStore } from "@/lib/store/gameStore";
import { FullPageSlider } from "@/components/ui/FullPageSlider";

function IntroPage() {
  return (
    <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
      <div className="text-center md:text-left">
        <span className="eyebrow mb-5">참가 방법</span>
        <h1 className="display-h1 mt-4 mb-6">
          3단계로 끝나는
          <br />
          부스 참여
        </h1>
        <p className="text-lg text-(--color-text-secondary) max-w-[480px] mx-auto md:mx-0 mb-2">
          마우스 휠을 굴려서 단계별로 확인하세요.
        </p>
        <p className="text-base text-(--color-text-muted) max-w-[480px] mx-auto md:mx-0">
          웨일 앱에서 추천인 코드를 등록하고, 인증 화면을 캡처해서 부스에 보여주시면 됩니다.
        </p>
      </div>
      <div className="aspect-[16/10] flex items-center justify-center p-4">
        <img
          src="/wf_02.png"
          alt="웨일프렌즈 캐릭터들"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

interface Step1Sub {
  num: string;
  title: string;
  desc: string;
  img: string;
}

const STEP1_SUBS: readonly Step1Sub[] = [
  {
    num: "1단계",
    title: "메뉴 열기",
    desc: "웨일 앱 우측 하단의 ≡ 메뉴 버튼을 눌러주세요.",
    img: "/referral-1.png",
  },
  {
    num: "2단계",
    title: "설정 진입",
    desc: "메뉴에서 설정 아이콘을 눌러 들어갑니다.",
    img: "/referral-2.png",
  },
  {
    num: "3단계",
    title: "추천인 코드 선택",
    desc: "설정 화면 상단의 추천인 코드 메뉴를 눌러주세요.",
    img: "/referral-3.png",
  },
];

function Step1SubPage({ s }: { s: Step1Sub }) {
  return (
    <div className="text-center max-w-[440px] mx-auto flex flex-col items-center">
      <span className="eyebrow mb-2">STEP 01 · {s.num}</span>
      <h2 className="display-h2 mt-2 mb-3">{s.title}</h2>
      <p className="text-base sm:text-lg text-(--color-text-secondary) mb-5">
        {s.desc}
      </p>
      <div className="aspect-[9/16] max-h-[68dvh] rounded-lg overflow-hidden bg-white border border-(--color-divider) shadow-(--shadow-soft)">
        <img
          src={s.img}
          alt={s.title}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

function Step2Page({ onCopy }: { onCopy: () => void }) {
  return (
    <div className="text-center max-w-[760px] mx-auto">
      <span className="eyebrow mb-5">STEP 02</span>
      <h2 className="display-h2 mt-4 mb-6">추천인 등록</h2>
      <p className="text-lg text-(--color-text-secondary) max-w-[540px] mx-auto mb-10">
        아래 코드를 복사해서 웨일 앱에 입력하고, 인증 완료 화면을 캡처해 주세요.
      </p>

      <div className="surface-card brand flex items-center justify-between gap-4 max-w-[500px] mx-auto mb-2">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.15em]">
          {REFERRAL_CODE}
        </span>
        <button className="cta-btn cta-btn-primary" onClick={onCopy}>
          복사
        </button>
      </div>
      <p className="text-sm text-(--color-text-muted) mb-8">
        복사 버튼을 누르면 클립보드에 저장됩니다
      </p>

      <div className="flex gap-2 justify-center flex-wrap">
        <a
          href={APP_DOWNLOAD.android}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-btn cta-btn-ghost cta-btn-large"
        >
          Google Play
        </a>
        <a
          href={APP_DOWNLOAD.ios}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-btn cta-btn-ghost cta-btn-large"
        >
          App Store
        </a>
      </div>
    </div>
  );
}

function Step3Page() {
  return (
    <div className="text-center max-w-[760px] mx-auto">
      <span className="eyebrow mb-2 sm:mb-5">STEP 03</span>
      <h2 className="display-h2 mt-2 mb-3 sm:mt-4 sm:mb-6">현장 인증 후 게임 참여</h2>
      <p className="text-sm sm:text-lg text-(--color-text-secondary) max-w-[540px] mx-auto mb-4 sm:mb-10">
        캡처한 인증 화면을 부스 운영진에게 보여주면 게임을 즐길 수 있어요.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[400px] sm:max-w-[600px] mx-auto mb-4 sm:mb-10">
        <div className="text-center">
          <div className="surface-card muted aspect-square flex items-center justify-center text-(--color-text-muted) mb-2 sm:mb-3 text-xs sm:text-base p-2">
            키캡 이미지
            <br />
            (추후 삽입)
          </div>
          <div className="text-sm sm:text-base font-bold">키캡</div>
        </div>
        <div className="text-center">
          <div className="surface-card muted aspect-square flex items-center justify-center text-(--color-text-muted) mb-2 sm:mb-3 text-xs sm:text-base p-2">
            인형 이미지
            <br />
            (추후 삽입)
          </div>
          <div className="text-sm sm:text-base font-bold">인형</div>
        </div>
      </div>

      <div className="surface-card accent max-w-[400px] sm:max-w-[600px] mx-auto mb-4 sm:mb-8 text-left px-4 sm:px-8 py-3 sm:py-7">
        <div className="text-[10px] sm:text-xs font-bold tracking-[0.12em] text-(--color-accent-deep) mb-1.5 sm:mb-3">
          참여 안내
        </div>
        <p className="text-xs sm:text-base leading-relaxed text-(--color-text-secondary)">
          <strong className="text-(--color-text)">
            참가 시 키캡 또는 인형 택1, 1등 시 둘 다 증정!
          </strong>
        </p>
      </div>

      <Link
        href="/conditions/rules/"
        className="cta-btn cta-btn-primary cta-btn-pill text-sm sm:text-xl px-6 py-3 sm:px-10 sm:py-5"
      >
        게임 미리 체험하기 →
      </Link>
    </div>
  );
}

export function ConditionsScreen() {
  const showToast = useGameStore((s) => s.showToast);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(REFERRAL_CODE);
      showToast("코드가 복사되었어요!");
    } catch {
      showToast("복사 실패. 직접 입력해주세요.");
    }
  }

  const pages = useMemo(
    () => [
      <IntroPage key="intro" />,
      ...STEP1_SUBS.map((s, i) => <Step1SubPage key={`step1-${i}`} s={s} />),
      <Step2Page key="step2" onCopy={copyCode} />,
      <Step3Page key="step3" />,
    ],
    // copyCode는 store selector + 클로저라 매 렌더 새 ref. showToast는 안정적이므로 deps 비움.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return <FullPageSlider pages={pages} mode="wheel" variant="light" />;
}
