import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const base = process.env.FLASH_CHECK_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Use a local server.");
const output = join(root, "artifacts", "flash-investigation");
mkdirSync(output, { recursive: true });
const executablePath =
  process.env.FLASH_BROWSER_EXECUTABLE ||
  (process.platform !== "win32"
    ? existsSync(chromium.executablePath())
      ? chromium.executablePath()
      : "/usr/bin/chromium"
    : undefined);
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : { channel: "msedge" }),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  proxy: process.env.HTTPS_PROXY
    ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" }
    : undefined,
});
const reports = [];

try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 950 },
      reducedMotion,
    });
    const errors = [];
    const hotUpdates = [];
    page.on("pageerror", (error) => errors.push(error.message.slice(0, 300)));
    page.on("console", (message) => {
      if (message.text().includes("[vite] hot updated")) hotUpdates.push(message.text());
    });
    await page.addInitScript(() => {
      window.__flashSamples = [];
      let last = 0;
      function visible(element) {
        if (!element) return false;
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return false;
        for (let node = element; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) === 0
          )
            return false;
        }
        return true;
      }
      function sample(time) {
        if (time - last >= 100) {
          last = time;
          const main = document.querySelector("main");
          window.__flashSamples.push({
            ms: Math.round(time),
            path: location.pathname,
            h1: visible(document.querySelector("h1")),
            nav: visible(document.querySelector("nav")),
            main: visible(main),
            textLength: main?.innerText.trim().length ?? 0,
          });
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    await page.locator("#bench-heading").waitFor();
    await page.waitForFunction(() => {
      const button = document.querySelector(".bench-run-card button");
      return button && Object.keys(button).some((key) => key.startsWith("__reactProps$"));
    });
    for (let second = 0; second <= 7; second++) {
      await page.screenshot({ path: join(output, `startup-${reducedMotion}-${second}.png`) });
      if (second === 2)
        await page.getByRole("button", { name: "Run this case", exact: true }).click();
      await page.waitForTimeout(1000);
    }
    for (const [link, selector] of [
      ["Evaluation lab", ".lab-experience"],
      ["Substrate", ".substrate-page"],
      ["Bench", ".bench-experience"],
    ]) {
      await page.getByRole("link", { name: link, exact: true }).click();
      await page.locator(selector).waitFor();
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: join(output, `navigation-${reducedMotion}-${link.replaceAll(" ", "-")}.png`),
      });
    }
    const samples = await page.evaluate(() => window.__flashSamples);
    const firstVisible = samples.findIndex((sample) => sample.h1 && sample.nav && sample.main);
    const afterPaint = samples.slice(Math.max(0, firstVisible));
    reports.push({
      reducedMotion,
      status: response.status(),
      samples: samples.length,
      firstVisibleMs: samples[firstVisible]?.ms ?? null,
      emptyMainSamples: afterPaint.filter((sample) => !sample.main || sample.textLength === 0),
      missingHeadingSamples: afterPaint.filter((sample) => !sample.h1),
      errors,
      hotUpdates,
    });
    await page.close();
  }
  writeFileSync(
    join(output, "results.json"),
    JSON.stringify({ browser: browser.version(), reports }, null, 2) + "\n",
  );
  for (const report of reports) {
    assert.equal(report.status, 200);
    assert.notEqual(report.firstVisibleMs, null);
    assert.deepEqual(report.hotUpdates, [], "HMR makes this run unsuitable for flash diagnosis.");
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.emptyMainSamples, []);
    assert.deepEqual(report.missingHeadingSamples, []);
    console.log(
      `PASS ${report.reducedMotion}: ${report.samples} content samples, no empty content sample.`,
    );
  }
  console.log("Screenshots and diagnostics: artifacts/flash-investigation");
} finally {
  await browser.close();
}
