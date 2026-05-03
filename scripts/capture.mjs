// scripts/capture.mjs — 게임 보드 4인 배치 시각 검증용 일회성 스크립트
// 실행: pnpm exec playwright exec scripts/capture.mjs
// 또는: node scripts/capture.mjs (chromium 경로 자동 감지 — Playwright cache)
//
// 시나리오:
//   1~5 (두 해상도) — 첫 턴부터 NPC 회전 1바퀴까지 (회귀 검증용)
//   6 (1920) — 손님이 LLAMA 와일드 카드 낸 직후
//   7 (1920) — 손님이 "그만하기" 직후 (quitted 박스 시각)
//   9 (1920) — 게임 종료 후 결과 화면 (등수는 비결정 — 매 실행마다 달라짐)
//
// 미구현 시나리오 (deterministic seed 도입 시 추가):
//   8 — 단독 생존 ("혼자 남았음" hint)
//   10/11 — 결과 화면 1등/꼴등 분기 (현재는 9에서 우연히 잡힘)

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "screenshots");
const PORT = process.env.PORT ?? "3000";
const URL = `http://localhost:${PORT}/game/`;

const VIEWPORTS = [
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

async function shoot(page, name) {
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`  → ${name}.png`);
}

async function gotoGame(page) {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
}

// 손님 턴 & playable 카드가 화면에 나타날 때까지 대기.
async function waitPlayerTurn(page, timeoutMs = 18000) {
  await page.waitForFunction(
    () => document.querySelectorAll(".game-card.large.playable").length > 0,
    { timeout: timeoutMs }
  );
}

async function clickFirstPlayable(page) {
  const card = page.locator(".game-card.large.playable").first();
  if ((await card.count()) === 0) return false;
  await card.click();
  return true;
}

async function tryClickLlama(page) {
  const card = page.locator(".game-card.large.playable.llama").first();
  if ((await card.count()) === 0) return false;
  await card.click();
  return true;
}

async function clickButton(page, text) {
  const btn = page.locator(`.action-panel button:has-text("${text}")`);
  if (!(await btn.count())) return false;
  if (!(await btn.isEnabled())) return false;
  await btn.click();
  return true;
}

async function isFinished(page) {
  return (await page.locator("text=최종 결과").count()) > 0;
}

// NPC 3명이 모두 행동하는데 약 2.2s × 3 = 6.6s + 모션 안정 버퍼
async function waitNpcsCycle(page) {
  await page.waitForTimeout(2500 * 3 + 800);
}

// === 시나리오 1~5 (두 해상도, 회귀 검증용) ============================
for (const vp of VIEWPORTS) {
  console.log(`\n[${vp.name}] base flow`);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const page = await context.newPage();

  await gotoGame(page);
  // 카드 등장 모션 + Next dev 컴파일 기다림
  try {
    await waitPlayerTurn(page, 20000);
  } catch {
    console.log("  ! 손님 턴 진입 안 됨 (페이지 로딩 실패?)");
    await context.close();
    continue;
  }
  await shoot(page, `${vp.name}_1_first_turn`);

  if (await clickFirstPlayable(page)) {
    await page.waitForTimeout(2500);
    await shoot(page, `${vp.name}_2_after_player_play`);

    await page.waitForTimeout(2500);
    await shoot(page, `${vp.name}_3_pepo_turn`);

    await page.waitForTimeout(2500);
    await shoot(page, `${vp.name}_4_naverwhale_turn`);

    await page.waitForTimeout(2500);
    await shoot(page, `${vp.name}_5_back_to_player`);
  } else {
    console.log("  ! 첫 턴에 playable 카드 없음");
  }

  await context.close();
  console.log(`[${vp.name}] base done`);
}

// === 시나리오 6 — LLAMA 와일드 (1920만) ==============================
{
  console.log(`\n[1920x1080] 6_llama_played`);
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  await gotoGame(page);

  let captured = false;
  for (let attempt = 0; attempt < 8 && !captured; attempt++) {
    try {
      await waitPlayerTurn(page, 14000);
    } catch {
      break;
    }
    if (await isFinished(page)) break;
    if (await tryClickLlama(page)) {
      await page.waitForTimeout(500);
      await shoot(page, "1920x1080_6_llama_played");
      captured = true;
      break;
    }
    // LLAMA 손에 없음 → 일반 카드 한 장 내고 다음 손님 턴 대기
    if (!(await clickFirstPlayable(page))) break;
    await waitNpcsCycle(page);
  }
  if (!captured) {
    console.log("  ! LLAMA 손에 안 들어옴 — 다음 실행에서 재시도");
  }
  await context.close();
}

// === 시나리오 7 — 그만하기 (1920) =====================================
{
  console.log(`\n[1920x1080] 7_quit`);
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  await gotoGame(page);

  // 첫 턴 — 강제로 한 장 내야 그만하기가 풀림 (룰 상)
  await waitPlayerTurn(page);
  if (await clickFirstPlayable(page)) {
    await waitNpcsCycle(page);
    try {
      await waitPlayerTurn(page, 14000);
      if (await clickButton(page, "그만하기")) {
        await page.waitForTimeout(700);
        await shoot(page, "1920x1080_7_quit");
      } else {
        console.log("  ! 그만 버튼 비활성 (조기 종료?)");
      }
    } catch {
      console.log("  ! 손님 두 번째 턴 도달 실패");
    }
  }
  await context.close();
}

// === 시나리오 9 — 결과 화면 (1920) ====================================
{
  console.log(`\n[1920x1080] 9_final_result`);
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  await gotoGame(page);

  // 게임이 끝날 때까지 손님은 가능한 한 카드 내기 (점수 최소화 = 1등 노림)
  // 단 결과는 비결정 — NPC 무작위 패에 따라 등수 달라짐.
  for (let turn = 0; turn < 30; turn++) {
    if (await isFinished(page)) break;
    try {
      await waitPlayerTurn(page, 12000);
    } catch {
      break;
    }
    if (await isFinished(page)) break;
    const played = await clickFirstPlayable(page);
    if (!played) {
      // 낼 카드 없음 → 뽑기 시도, 안 되면 그만
      if (!(await clickButton(page, "카드 뽑기"))) {
        await clickButton(page, "그만하기");
      }
    }
    await waitNpcsCycle(page);
  }

  await page.waitForTimeout(800);
  if (await isFinished(page)) {
    await shoot(page, "1920x1080_9_final_result");
  } else {
    console.log("  ! 30턴 내 게임 종료 못 함");
  }
  await context.close();
}

await browser.close();
console.log("\nDONE. Screenshots in:", OUT_DIR);
