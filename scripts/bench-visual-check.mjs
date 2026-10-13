import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const results = [];
const errors = [];
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.locator("#bench-heading").waitFor({ timeout: 60000 });
  await page.waitForFunction(
    () => {
      const button = document.querySelector(".bench-chapter");
      return !!button && Object.keys(button).some((key) => key.startsWith("__reactProps$"));
    },
    null,
    { timeout: 120000 },
  );
  const heading = await page.locator("#bench-heading").innerText();
  assert.match(heading, /Reasoning is not/);
  assert.match(heading, /the verdict/);
  assert(await page.locator(".bench-stage-rings").isVisible());
  assert((await page.locator(".bench-chapter").count()) === 3);
  results.push("desktop hero, regulatory orbit, and three trials");
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/bench-cinematic-desktop.png", fullPage: true });

  const css = await page.locator(".bench-experience").evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, family: style.fontFamily };
  });
  assert(
    css.background.includes("9, 9, 9"),
    "Bench background does not match approved reference: " + css.background,
  );
  results.push("scoped midnight visual tokens: " + css.family);

  const run = page.getByRole("button", { name: "Run Berth 7" });
  await run.click();
  assert(await page.locator("#bench-workbench").isVisible());
  await page.getByRole("button", { name: "Step forward" }).click();
  assert((await page.locator(".bench-stage-decision strong").count()) === 1);
  results.push("Berth 7 CTA and replay stepping");

  await page.locator(".bench-chapter").nth(1).click();
  await page.waitForFunction(
    () => document.querySelector(".bench-chapter.is-active")?.textContent?.includes("440"),
    null,
    { timeout: 20000 },
  );
  assert((await page.locator(".bench-chapter.is-active").count()) === 1);
  assert.match(await page.locator(".bench-chapter.is-active").innerText(), /Run 440|Yield|440/i);
  results.push("trial selection and active state");

  await page.goto(BASE + "/substrate", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.locator("#substrate-heading").waitFor({ timeout: 60000 });
  assert((await page.locator(".substrate-shell").count()) > 0);
  assert((await page.locator(".bench-experience").count()) === 0);
  results.push("Substrate styling remains unchanged");

  await page.goto(BASE + "/lab", { waitUntil: "domcontentloaded", timeout: 90000 });
  assert((await page.locator(".bench-experience").count()) === 0);
  results.push("Evaluation Lab styling isolated");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await mobile.locator("#bench-heading").waitFor({ timeout: 60000 });
  await mobile.screenshot({ path: "artifacts/bench-cinematic-mobile.png", fullPage: true });
  const metrics = await mobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    buttons: [...document.querySelectorAll(".bench-hero-actions button")].length,
  }));
  assert(
    metrics.scrollWidth <= metrics.viewport + 3,
    "Mobile horizontal overflow: " + JSON.stringify(metrics),
  );
  assert(metrics.buttons > 0);
  results.push("390px mobile layout, no horizontal overflow");
  assert.deepEqual(errors, []);
  results.push("zero uncaught browser errors");
  for (const result of results) console.log("PASS", result);
  console.log("RESULT: PASS " + results.length + " checks");
} finally {
  await browser.close();
}
