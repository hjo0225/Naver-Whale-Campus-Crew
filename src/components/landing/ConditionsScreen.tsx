"use client";

import Link from "next/link";
import { useMemo } from "react";
import { REFERRAL_CODE } from "@/lib/config";
import { useGameStore } from "@/lib/store/gameStore";
import { FullPageSlider } from "@/components/ui/FullPageSlider";
import {
  Rule01Page,
  Rule02Page,
  Rule03Page,
  Rule04Page,
  Rule05Page,
} from "@/components/landing/RulesScreen";

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
          본인 휴대폰의 웨일 앱에서 추천인 코드를 등록하고, 인증 화면을 캡처해서 부스에 보여주시면 됩니다.
        </p>
      </div>
      <div className="aspect-[16/10] bg-(--color-board-soft) border border-dashed border-(--color-text-muted)/40 rounded-2xl flex items-center justify-center text-(--color-text-muted) text-center p-8 text-lg">
        부스 안내 이미지
        <br />
        (추후 삽입)
      </div>
    </div>
  );
}

function Step1Page() {
  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <div>
        <span className="eyebrow mb-5">STEP 01</span>
        <h2 className="display-h2 mt-4 mb-6">
          웨일 앱에서
          <br />
          추천인 코드 입력
        </h2>
        <p className="text-lg text-(--color-text-secondary) leading-relaxed mb-3">
          본인 휴대폰의 네이버 웨일 모바일 앱을 실행하고{" "}
          <strong className="text-(--color-text)">설정 → 추천인 코드</strong> 메뉴로 이동해주세요.
        </p>
        <p className="text-lg text-(--color-text-secondary) leading-relaxed mb-3">
          안내 화면에서 부스 추천인 코드를 입력하면 등록 완료입니다.
        </p>
        <p className="text-base text-(--color-text-muted)">
          웨일 앱이 없으시면 부스 운영진에게 말씀해 주세요.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: "1", label: "설정 진입" },
          { step: "2", label: "추천인 코드 메뉴" },
          { step: "3", label: "코드 입력" },
        ].map((s) => (
          <div
            key={s.step}
            className="surface-card muted aspect-[9/16] flex flex-col items-center justify-center text-(--color-text-muted) p-3 text-center"
          >
            <div className="text-xs font-bold tracking-[0.12em] text-(--color-brand) mb-2">
              STEP {s.step}
            </div>
            <div className="text-sm leading-relaxed">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step2Page({ onCopy }: { onCopy: () => void }) {
  return (
    <div className="text-center max-w-[760px] mx-auto">
      <span className="eyebrow mb-5">STEP 02</span>
      <h2 className="display-h2 mt-4 mb-6">
        코드 복사
        <br />+ 인증 화면 캡처
      </h2>
      <p className="text-lg text-(--color-text-secondary) max-w-[540px] mx-auto mb-10">
        아래 코드를 복사해서 웨일 앱에 입력하고, 인증 완료 화면을 휴대폰으로 캡처해 주세요.
      </p>

      <div className="surface-card brand flex items-center justify-between gap-4 max-w-[500px] mx-auto mb-2">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-[0.15em]">
          {REFERRAL_CODE}
        </span>
        <button className="cta-btn cta-btn-primary" onClick={onCopy}>
          복사
        </button>
      </div>
      <p className="text-sm text-(--color-text-muted) mb-10">
        복사 버튼을 누르면 클립보드에 저장됩니다
      </p>

      <div className="surface-card accent max-w-[540px] mx-auto text-left px-6 sm:px-8 py-6 sm:py-7">
        <div className="text-xs font-bold tracking-[0.12em] text-(--color-accent-deep) mb-3">
          인증 화면 캡처 안내
        </div>
        <p className="text-base leading-relaxed text-(--color-text-secondary)">
          코드 입력 후 표시되는{" "}
          <strong className="text-(--color-text)">"등록 완료" 화면을 캡처</strong>해 두세요. 부스에서 운영진에게 보여주시면 됩니다.
        </p>
      </div>
    </div>
  );
}

function Step3Page() {
  return (
    <div className="text-center max-w-[760px] mx-auto">
      <span className="eyebrow mb-5">STEP 03</span>
      <h2 className="display-h2 mt-4 mb-6">현장 인증 + 게임 참여</h2>
      <p className="text-lg text-(--color-text-secondary) max-w-[540px] mx-auto mb-10">
        캡처한 인증 화면을 부스 운영진에게 보여주시면 바로 게임을 시작할 수 있어요.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-[600px] mx-auto mb-10">
        <div className="text-center">
          <div className="surface-card muted aspect-square flex items-center justify-center text-(--color-text-muted) mb-3">
            키캡 이미지
            <br />
            (추후 삽입)
          </div>
          <div className="font-bold">키캡</div>
        </div>
        <div className="text-center">
          <div className="surface-card muted aspect-square flex items-center justify-center text-(--color-text-muted) mb-3">
            인형 이미지
            <br />
            (추후 삽입)
          </div>
          <div className="font-bold">인형</div>
        </div>
      </div>

      <div className="surface-card accent max-w-[600px] mx-auto mb-8 text-left px-6 sm:px-8 py-6 sm:py-7">
        <div className="text-xs font-bold tracking-[0.12em] text-(--color-accent-deep) mb-3">
          참여 안내
        </div>
        <p className="text-base leading-relaxed text-(--color-text-secondary)">
          <strong className="text-(--color-text)">
            참가 시 키캡 또는 인형 택1, 1등 시 둘 다 증정!
          </strong>
        </p>
      </div>

      <Link href="/rules/" className="cta-btn cta-btn-primary cta-btn-pill">
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
      <Step1Page key="step1" />,
      <Step2Page key="step2" onCopy={copyCode} />,
      <Step3Page key="step3" />,
      <Rule01Page key="r1" />,
      <Rule02Page key="r2" />,
      <Rule03Page key="r3" />,
      <Rule04Page key="r4" />,
      <Rule05Page key="r5" showStartButton={false} />,
    ],
    // copyCode는 store selector + 클로저라 매 렌더 새 ref. showToast는 안정적이므로 deps 비움.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return <FullPageSlider pages={pages} mode="wheel" variant="light" />;
}
