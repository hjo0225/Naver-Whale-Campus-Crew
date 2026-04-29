"use client";

import Link from "next/link";
import { APP_DOWNLOAD, REFERRAL_CODE } from "@/lib/config";
import { useGameStore } from "@/lib/store/gameStore";

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

  return (
    <div className="scroll-screen">
      {/* intro */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            참가 방법
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
            3단계로 끝나는<br />부스 참여
          </h1>
          <p className="text-lg text-(--color-text-secondary) max-w-[600px] mx-auto">
            아래로 스크롤해서 단계별로 확인하세요.
          </p>
        </div>
      </section>

      {/* step 1 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
              STEP 01
            </span>
            <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
              웨일 앱에서<br />추천인 코드 입력
            </h2>
            <p className="text-lg text-(--color-text-secondary) leading-relaxed mb-3">
              네이버 웨일 모바일 앱을 실행하고{" "}
              <strong className="text-(--color-text)">설정 → 추천인 코드</strong> 메뉴로 이동해주세요.
            </p>
            <p className="text-lg text-(--color-text-secondary) leading-relaxed mb-3">
              안내 화면에서 부스 추천인 코드를 입력하면 등록 완료입니다.
            </p>
            <p className="text-base text-(--color-text-muted)">
              아직 웨일이 없으시면 먼저 다음 단계에서 다운로드받아주세요.
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
                className="aspect-[9/16] bg-(--color-bg-soft) border border-(--color-border) rounded-xl flex flex-col items-center justify-center text-(--color-text-muted) p-3 text-center"
              >
                <div className="text-xs font-bold tracking-[0.12em] text-(--color-brand) mb-2">
                  STEP {s.step}
                </div>
                <div className="text-sm leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* step 2 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            STEP 02
          </span>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
            코드 복사<br />+ 앱 다운로드
          </h2>
          <p className="text-lg text-(--color-text-secondary) max-w-[540px] mx-auto mb-10">
            아래 코드를 복사해서 웨일 앱에 붙여넣어주세요. 아직 앱이 없다면 함께 받으실 수 있어요.
          </p>

          <div className="flex items-center justify-between gap-4 px-6 py-5 border border-(--color-border) rounded-md bg-(--color-bg-soft) max-w-[500px] mx-auto mb-2">
            <span className="font-mono text-3xl font-bold tracking-[0.15em]">{REFERRAL_CODE}</span>
            <button className="btn btn-secondary" onClick={copyCode}>
              복사
            </button>
          </div>
          <p className="text-sm text-(--color-text-muted) mb-10">
            복사 버튼을 누르면 클립보드에 저장됩니다
          </p>

          <div className="pt-8 border-t border-(--color-border-light) max-w-[540px] mx-auto">
            <p className="text-xs font-bold text-(--color-text-muted) tracking-[0.08em] mb-4">
              앱 다운로드
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                className="btn btn-secondary btn-large"
                href={APP_DOWNLOAD.android}
                target="_blank"
                rel="noopener"
              >
                📱 Google Play
              </a>
              <a
                className="btn btn-secondary btn-large"
                href={APP_DOWNLOAD.ios}
                target="_blank"
                rel="noopener"
              >
                🍎 App Store
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* step 3 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            STEP 03
          </span>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
            부스 방문 + 상품
          </h2>
          <p className="text-lg text-(--color-text-secondary) max-w-[540px] mx-auto mb-10">
            부스에서 코드 등록 인증 후 게임에 참여할 수 있어요.
          </p>

          <div className="grid grid-cols-2 gap-6 max-w-[600px] mx-auto mb-10">
            <div className="text-center">
              <div className="aspect-square bg-(--color-bg-soft) border border-(--color-border) rounded-xl flex items-center justify-center text-(--color-text-muted) mb-3">
                키캡 이미지<br />(추후 삽입)
              </div>
              <div className="font-bold">키캡</div>
            </div>
            <div className="text-center">
              <div className="aspect-square bg-(--color-bg-soft) border border-(--color-border) rounded-xl flex items-center justify-center text-(--color-text-muted) mb-3">
                인형 이미지<br />(추후 삽입)
              </div>
              <div className="font-bold">인형</div>
            </div>
          </div>

          <div className="px-8 py-7 border border-(--color-border) rounded-xl max-w-[600px] mx-auto mb-8 text-left">
            <div className="text-xs font-bold tracking-[0.12em] text-(--color-brand) mb-3">
              참여 안내
            </div>
            <p className="text-base leading-relaxed text-(--color-text-secondary)">
              <strong className="text-(--color-brand)">
                참가 시 키캡 또는 인형 택1, 1등 시 둘 다 증정!
              </strong>
            </p>
          </div>

          <Link href="/rules/" className="btn btn-primary btn-large">
            게임 미리 체험하기 →
          </Link>
        </div>
      </section>
    </div>
  );
}
