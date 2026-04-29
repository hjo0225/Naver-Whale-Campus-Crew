"use client";

import Link from "next/link";
import { CARD_TYPES, LLAMA_CARD } from "@/lib/game/data";
import { Card } from "@/components/game/Card";

export function RulesScreen() {
  return (
    <div className="scroll-screen">
      {/* RULE 01: 카드 종류 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            RULE 01 · 카드 종류
          </span>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">카드는 6종류</h2>
          <p className="text-lg text-(--color-text-secondary) mb-10">
            1~5 숫자 카드와 캐릭6(라마) 카드. 마지막에 손에 들고 있으면{" "}
            <strong className="text-(--color-text)">그 점수만큼 깎입니다</strong>.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {CARD_TYPES.map((c) => (
              <div key={String(c.id)} className="flex flex-col items-center gap-2">
                <Card card={c} size="large" />
                <span className="text-sm font-bold text-(--color-text-secondary)">-{c.points}점</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <Card card={LLAMA_CARD} size="large" />
              <span className="text-sm font-bold text-(--color-llama-text)">-{LLAMA_CARD.points}점</span>
            </div>
          </div>
          <p className="text-(--color-text-secondary)">
            캐릭6(라마)는 <strong>-8점 폭탄</strong>! 빨리 던지는 게 좋아요
          </p>
        </div>
      </section>

      {/* RULE 02: 매칭 규칙 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            RULE 02 · 매칭 규칙
          </span>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
            같은 숫자 또는 +1만
          </h2>
          <p className="text-lg text-(--color-text-secondary) mb-10">
            바닥에 놓인 카드와{" "}
            <strong className="text-(--color-text)">같은 숫자나 한 칸 위 숫자만</strong> 낼 수 있어요.
          </p>

          <div className="flex flex-col items-center gap-6">
            <div>
              <div className="text-sm font-bold text-(--color-text-muted) mb-2">바닥에 캐릭3이 있다면</div>
              <Card card={CARD_TYPES[2]!} size="large" />
            </div>
            <div className="text-2xl text-(--color-text-muted)">↓</div>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <span className="font-bold text-green-600 w-16">✓ 가능</span>
                <Card card={CARD_TYPES[2]!} />
                <Card card={CARD_TYPES[3]!} />
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-red-500 w-16">✗ 불가</span>
                <Card card={CARD_TYPES[0]!} faded />
                <Card card={CARD_TYPES[1]!} faded />
                <Card card={CARD_TYPES[4]!} faded />
              </div>
            </div>
          </div>

          <p className="text-(--color-text-secondary) mt-8">
            <strong>5 위에는 캐릭6(라마)</strong>, <strong>캐릭6 위에는 1</strong>만 가능
          </p>
        </div>
      </section>

      {/* RULE 03: 차례 행동 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            RULE 03 · 차례 행동
          </span>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
            내 차례에 3가지 선택
          </h2>
          <p className="text-lg text-(--color-text-secondary) mb-10">
            매 차례 <strong className="text-(--color-text)">셋 중 하나</strong>를 골라야 해요.
          </p>

          <div className="grid md:grid-cols-3 gap-4 max-w-[760px] mx-auto">
            {[
              { n: "①", t: "카드 내기", d: "매칭되는 카드를 골라 바닥에 내기" },
              { n: "②", t: "카드 뽑기", d: "덱에서 1장 뽑고 차례 종료" },
              { n: "③", t: "그만하기", d: "이 라운드 이탈, 손에 든 카드로 점수 확정" },
            ].map((a) => (
              <div key={a.t} className="border border-(--color-border) rounded-xl p-6">
                <div className="text-3xl text-(--color-brand) font-bold mb-3">{a.n}</div>
                <h3 className="text-xl font-bold mb-2">{a.t}</h3>
                <p className="text-(--color-text-secondary) text-sm">{a.d}</p>
              </div>
            ))}
          </div>

          <p className="text-(--color-text-secondary) mt-8">
            못 내겠으면 <strong>뽑거나 그만하기</strong>를 선택
          </p>

          <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 border border-(--color-border) bg-(--color-bg-soft) rounded-xl text-base text-(--color-text-secondary)">
            <span className="text-xs font-bold tracking-[0.12em] text-(--color-brand)">예외</span>
            <span>
              <strong className="text-(--color-text)">다른 사람이 모두 그만하면 뽑기 불가</strong>
              {" "}— 낼 카드만 내거나 그만하세요
            </span>
          </div>

          <div className="mt-3 inline-flex items-center gap-3 px-5 py-3 border border-(--color-brand)/30 bg-(--color-brand-soft) rounded-xl text-base text-(--color-text-secondary)">
            <span className="text-xs font-bold tracking-[0.12em] text-(--color-brand)">첫 턴</span>
            <span>
              <strong className="text-(--color-text)">일단 한 장 내고 시작!</strong>
              {" "}첫 턴엔 그만하기 / 뽑기 잠금 (낼 카드 없을 때만 뽑기 가능)
            </span>
          </div>
        </div>
      </section>

      {/* RULE 04: 점수 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            RULE 04 · 점수 계산
          </span>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
            카드를 빨리 털어내세요
          </h2>
          <p className="text-lg text-(--color-text-secondary) mb-10">
            라운드 끝에 손에 남은 카드만큼{" "}
            <strong className="text-(--color-text)">점수가 깎입니다</strong>. 0장이면 페널티 없음,
            라마(8점)는 가장 무거운 폭탄.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <Card card={CARD_TYPES[0]!} />
            <Card card={CARD_TYPES[3]!} />
            <Card card={CARD_TYPES[3]!} />
            <Card card={LLAMA_CARD} />
          </div>
          <p className="text-(--color-text-secondary) mb-2">
            예시 손패: 1 + 4 + (4 중복은 미카운트) + 8 ={" "}
            <strong className="text-(--color-text)">−13점 차감</strong>
          </p>
          <p className="text-sm text-(--color-text-muted)">
            ※ 같은 카드를 여러 장 들고 있어도 1번만 차감
          </p>
        </div>
      </section>

      {/* RULE 05: 승리 */}
      <section className="scroll-page">
        <div className="max-w-[960px] w-full text-center">
          <span className="inline-block text-sm font-bold tracking-[0.14em] text-(--color-brand) mb-5">
            RULE 05 · 승리 조건
          </span>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
            두 명과 1대1 두 판 승부
          </h2>
          <p className="text-lg text-(--color-text-secondary) mb-8">
            <strong className="text-(--color-text)">HYLION</strong>과 한 판,{" "}
            <strong className="text-(--color-text)">네이버웨일</strong>과 한 판. 매 라운드{" "}
            <strong className="text-(--color-text)">점수 더 낮은 쪽이 승!</strong>{" "}
            <span className="text-(--color-text-muted)">(동점도 손님 승 처리)</span>
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-[640px] mx-auto mb-10">
            <div className="border border-(--color-brand) bg-(--color-brand-soft) rounded-xl p-5 text-left">
              <div className="text-xs font-bold tracking-[0.12em] text-(--color-brand) mb-2">
                두 판 모두 승
              </div>
              <div className="font-extrabold text-lg mb-1">완전 정복</div>
              <p className="text-sm text-(--color-text-secondary)">
                키캡 + 인형 <strong className="text-(--color-text)">둘 다 증정</strong>
              </p>
            </div>
            <div className="border border-(--color-border) rounded-xl p-5 text-left">
              <div className="text-xs font-bold tracking-[0.12em] text-(--color-text-muted) mb-2">
                참가 / 한 판 승
              </div>
              <div className="font-extrabold text-lg mb-1">기념 상품</div>
              <p className="text-sm text-(--color-text-secondary)">
                키캡 또는 인형 중 <strong className="text-(--color-text)">1개 택1</strong>
              </p>
            </div>
          </div>

          <Link href="/game/" className="btn btn-primary btn-large">
            게임 시작 ▶
          </Link>
        </div>
      </section>
    </div>
  );
}
