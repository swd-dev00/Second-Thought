import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright";

// Record real UI and real server outcomes. No mocked success and no paid probe
// unless --live-probes is supplied; missing-key responses are safe to exercise.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const base = process.env.JUDGE_REHEARSAL_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Use a local server.");
const output = join(root, "artifacts", "judge-rehearsal");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.JUDGE_BROWSER_EXECUTABLE
    ? { executablePath: process.env.JUDGE_BROWSER_EXECUTABLE }
    : process.platform === "win32"
      ? { channel: "msedge" }
      : {
          executablePath: existsSync(chromium.executablePath())
            ? chromium.executablePath()
            : "/usr/bin/chromium",
        }),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: output, size: { width: 1440, height: 1000 } },
});
const errors = [],
  reloads = [],
  checkpoints = [];
let documentLoads = 0;
const documentNavigations = [];
const recordings = [];
async function open(name, path) {
  const createdAt = performance.now();
  const tab = await context.newPage();
  recordings.push({ name, video: tab.video(), createdAt });
  tab.on("pageerror", (error) => errors.push(error.message.slice(0, 300)));
  tab.on("domcontentloaded", () => {
    documentLoads++;
    documentNavigations.push({
      tab: name,
      at: performance.now(),
      path: new URL(tab.url()).pathname,
    });
  });
  tab.on("crash", () => errors.push(`Browser tab crashed: ${name}`));
  tab.on("console", (message) => {
    if (/\[vite\].*(hot updated|reload)/i.test(message.text())) reloads.push(message.text());
  });
  assert.equal((await tab.goto(base + path, { waitUntil: "networkidle" })).status(), 200);
  await tab.evaluate(() => document.fonts.ready);
  return tab;
}
let page;
let start;
let result;
try {
  const bench = await open("bench", "/");
  const lab = await open("lab", "/lab");
  await lab.locator(".lab-metric-grid").scrollIntoViewIfNeeded();
  const substrate = await open("connections", "/substrate#connections");
  await substrate.locator("#connections").scrollIntoViewIfNeeded();
  await substrate
    .getByText("Key needed", { exact: true })
    .or(substrate.getByText("Key present", { exact: true }))
    .first()
    .waitFor();
  page = bench;
  await page.bringToFront();
  await page.waitForFunction(() => {
    const button = document.querySelector(".bench-run-card button");
    return button && Object.keys(button).some((key) => key.startsWith("__reactProps$"));
  });
  assert.match(await page.locator(".bench-decision-shift").innerText(), /Not committed/);
  await page.evaluate(() => window.scrollTo(0, 0));
  start = performance.now();
  const until = async (seconds) => {
    const remaining = start + seconds * 1000 - performance.now();
    if (remaining > 0) await page.waitForTimeout(remaining);
  };
  const mark = async (stage) => {
    const seconds = (performance.now() - start) / 1000;
    checkpoints.push({ stage, seconds });
    await page.screenshot({ path: join(output, `${stage}.png`) });
    console.log(`${seconds.toFixed(2)}s ${stage}`);
  };
  await mark("bench-start");
  await until(15);
  await page.locator(".bench-run-card").scrollIntoViewIfNeeded();
  await mark("uncommitted-case");
  await until(30);
  const replayStart = performance.now();
  await page.getByRole("button", { name: "Run this case", exact: true }).click();
  await mark("replay-start");
  await page.locator("#bench-run-progress[aria-valuenow='100']").waitFor({ timeout: 25000 });
  const replaySeconds = (performance.now() - replayStart) / 1000;
  const decisionShift = await page.locator(".bench-decision-shift").innerText();
  assert.match(decisionShift, /Targeted exam on HS 8507/);
  await mark("supported-judgment");
  await until(70);
  await mark("controlled-case-boundary");
  await until(85);
  page = lab;
  await page.bringToFront();
  await page.getByText("Closed-world intervention success", { exact: true }).waitFor();
  await page.locator(".lab-metric-grid").scrollIntoViewIfNeeded();
  await mark("lab-qualified-metrics");
  await until(110);
  page = substrate;
  await page.bringToFront();
  await page.locator("#connections").waitFor();
  await page.locator("#connections").scrollIntoViewIfNeeded();
  await page
    .getByText("Key needed", { exact: true })
    .or(page.getByText("Key present", { exact: true }))
    .first()
    .waitFor();
  await mark("connection-checks");
  const outcomes = {};
  for (const [provider, seconds, buttonName] of [
    ["lightning", 115, "Call Lightning"],
    ["tavily", 130, "Call Tavily"],
  ]) {
    await until(seconds);
    const button = page.getByRole("button", { name: buttonName, exact: true });
    const card = button.locator("..");
    const missing = (await card.innerText()).includes("Key needed");
    if (!missing && !process.argv.includes("--live-probes")) {
      outcomes[provider] = "Configured; not attempted without --live-probes.";
      continue;
    }
    if (!(await button.isEnabled())) {
      outcomes[provider] = "Not attempted; another request pending.";
      continue;
    }
    await button.click();
    try {
      await page.waitForFunction(
        (provider) => {
          const text = document.getElementById(`${provider}-result`)?.innerText.trim();
          return text && !text.includes("Waiting for response");
        },
        provider,
        { timeout: 14000 },
      );
      outcomes[provider] = (await page.locator(`#${provider}-result`).innerText()).slice(0, 500);
    } catch {
      outcomes[provider] = "Pending at the presentation deadline; not claimed successful.";
    }
    await mark(`${provider}-outcome`);
  }
  await until(150);
  page = bench;
  await page.bringToFront();
  assert.equal(await page.locator("#bench-run-progress").getAttribute("aria-valuenow"), "100");
  await page.locator(".bench-decision-shift").scrollIntoViewIfNeeded();
  await mark("closing-judgment");
  await until(170);
  const elapsedSeconds = (performance.now() - start) / 1000;
  result = {
    boundary:
      "Silent automated browser rehearsal, not a narrated final submission or an edit of the original Windows recording.",
    browser: browser.version(),
    viewport: { width: 1440, height: 1000 },
    base,
    commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    elapsedSeconds,
    replaySeconds,
    checkpoints,
    outcomes,
    decisionShift,
    errors,
    reloads,
    documentLoads,
    documentNavigations,
  };
  assert.ok(elapsedSeconds < 180, "Actual path must fit the deadline.");
  assert.deepEqual(errors, []);
  assert.deepEqual(reloads, [], "HMR makes this recording unstable.");
  assert.equal(documentLoads, 3, "Unexpected full reload in the three preloaded tabs.");
} catch (error) {
  writeFileSync(
    join(output, "failed-take.json"),
    `${JSON.stringify(
      {
        error: error.message,
        errors,
        reloads,
        documentLoads,
        documentNavigations,
        checkpoints,
      },
      null,
      2,
    )}\n`,
  );
  throw error;
} finally {
  await context.close();
  if (result) {
    result.videos = await Promise.all(
      recordings.map(async (recording) => ({
        name: recording.name,
        path: await recording.video.path(),
        preRollSeconds: (start - recording.createdAt) / 1000,
      })),
    );
    writeFileSync(join(output, "timing.json"), `${JSON.stringify(result, null, 2)}\n`);
    console.log(
      `Measured path: ${result.elapsedSeconds.toFixed(3)} seconds. Video/timing: ${output}`,
    );
  }
  await browser.close();
}
