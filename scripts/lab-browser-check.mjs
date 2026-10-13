import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
const checks = [];
const BASE = "http://127.0.0.1:8080";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(BASE + "/lab", { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.locator(".lab-experience h1").waitFor({ timeout: 90000 });
  await page.waitForFunction(
    () => {
      const link = document.querySelector(".lab-main-action");
      return !!link && Object.keys(link).some((key) => key.startsWith("__reactProps$"));
    },
    null,
    { timeout: 120000 },
  );
  assert.match(
    await page.locator(".lab-experience h1").innerText(),
    /Intelligence deserves\s+an audit/i,
  );
  assert.equal(await page.locator(".lab-metric").count(), 3);
  assert.equal(await page.locator(".lab-metrics-table tbody tr").count(), 10);
  assert.match(await page.locator(".lab-graphic-core strong").innerText(), /64/);
  checks.push("editorial Lab hero, 64 trials, three metrics, ten comparison rows");
  const shell = await page.locator(".lab-shell").count();
  assert.equal(shell, 1);
  assert.equal(await page.locator(".bench-experience").count(), 0);
  const css = await page
    .locator(".lab-experience")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  assert(css.includes("9, 9, 9"), "Expected midnight canvas: " + css);
  assert.equal(await page.locator(".lab-bar-group").count(), 3);
  assert.equal(await page.locator(".lab-bar-fill").count(), 6);
  const chartData = await page
    .locator(".lab-bar-fill")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        width: element.getBoundingClientRect().width,
        color: getComputedStyle(element).backgroundColor,
      })),
    );
  assert(
    chartData.some((bar) => bar.width > 10 && bar.color.includes("180, 106, 255")),
    JSON.stringify(chartData),
  );
  assert(
    chartData.some((bar) => bar.width > 10 && bar.color.includes("129, 123, 145")),
    JSON.stringify(chartData),
  );
  checks.push("midnight-violet route styling, chart renders baseline and regulated");
  await page.locator(".lab-main-action").click();
  await page.waitForFunction(() => location.hash === "#lab-results");
  checks.push("Explore results action navigates to chart");
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/lab-violet-desktop.png", fullPage: true });
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(BASE + "/lab", { waitUntil: "domcontentloaded", timeout: 120000 });
  await mobile.locator(".lab-experience h1").waitFor({ timeout: 90000 });
  const metrics = await mobile.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    header: !!document.querySelector(".lab-shell .substrate-nav"),
  }));
  assert(metrics.header);
  assert(metrics.scrollWidth <= metrics.viewport + 3, JSON.stringify(metrics));
  await mobile.screenshot({ path: "artifacts/lab-violet-mobile.png", fullPage: true });
  checks.push("390px mobile, no horizontal overflow");
  assert.deepEqual(errors, []);
  checks.push("no uncaught browser errors");
  for (const check of checks) console.log("PASS", check);
  console.log("RESULT: PASS " + checks.length + " checks");
} finally {
  await browser.close();
}
