import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-sandbox"] });
const results = [];
const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(base + "/substrate", { waitUntil: "domcontentloaded", timeout: 90000 });
  const tabs = page.locator(".substrate-runtime-tab");
  await tabs.first().waitFor({ timeout: 60000 });
  await page.waitForFunction(() => Object.keys(document.querySelector(".substrate-runtime-tab") ?? {})
    .some((key) => key.startsWith("__reactProps$")), null, { timeout: 120000 });

  assert.equal(await tabs.count(), 4);
  assert.equal(await tabs.first().getAttribute("aria-pressed"), "true");
  assert.match(await page.locator(".substrate-runtime-inspect h3").innerText(), /Read what is actually known/);
  assert.match(await page.locator(".substrate-runtime-example").getAttribute("href"), /trial=berth-7/);
  results.push("four focusable architecture stages with initial Evidence example");

  const tests = [
    [1, /Measure the gap/, "yield-440"],
    [2, /Choose the cognition/, "door-2"],
    [3, /Commit only/, "yield-440"],
    [0, /Read what is/, "berth-7"],
  ];
  for (const [index, heading, id] of tests) {
    await tabs.nth(index).click();
    await page.waitForFunction((i) => document.querySelectorAll(".substrate-runtime-tab")[i]?.getAttribute("aria-pressed") === "true", index, { timeout: 12000 });
    assert.match(await page.locator(".substrate-runtime-inspect h3").innerText(), heading);
    assert((await page.locator(".substrate-runtime-example").getAttribute("href")).includes("trial=" + id));
  }
  results.push("every stage updates its explanation and real Bench trial destination");

  assert.match(await page.locator(".substrate-pass-footnote").innerText(), /not a connectivity test/i);
  assert((await page.locator(".substrate-pass-test-link").getAttribute("href")) === "#connections");
  await page.locator(".substrate-pass-test-link").click();
  assert.equal(new URL(page.url()).hash, "#connections");
  results.push("provider status is honest and opens existing connection tests");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  mobile.on("pageerror", (err) => errors.push(err.message));
  await mobile.goto(base + "/substrate", { waitUntil: "domcontentloaded", timeout: 90000 });
  await mobile.locator(".substrate-runtime-tab").first().waitFor({ timeout: 60000 });
  const dimensions = await mobile.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  assert(dimensions.width <= dimensions.viewport + 3, "Substrate mobile horizontal overflow: " + JSON.stringify(dimensions));
  results.push("390px mobile width without horizontal overflow");

  assert.deepEqual(errors, []);
  results.push("no uncaught browser errors");
  for (const result of results) console.log("PASS", result);
  console.log("SUBSTRATE EXPLORER: PASS " + results.length);
} finally {
  await browser.close();
}
