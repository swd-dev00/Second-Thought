import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { toCrossJSON } from "seroval";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const base = process.env.SUBSTRATE_CHECK_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Use a local test server.");
const output = join(root, "artifacts", "substrate-design");
mkdirSync(output, { recursive: true });
const executablePath =
  process.env.SUBSTRATE_BROWSER_EXECUTABLE ||
  (existsSync(chromium.executablePath()) ? chromium.executablePath() : "/usr/bin/chromium");
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  proxy: process.env.HTTPS_PROXY
    ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" }
    : undefined,
});
const checks = [];
const pages = [];
const pageErrors = [];
const failedAssets = new Set();
function passed(name) {
  checks.push(name);
}
async function open(viewport, reducedMotion = "reduce") {
  const page = await browser.newPage({ viewport, reducedMotion });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (!new URL(request.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
      failedAssets.add(request.url());
    }
  });
  pages.push(page);
  return page;
}
async function assertNoOverflow(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    ),
    false,
  );
}
function response(result) {
  return JSON.stringify(toCrossJSON({ result, error: undefined, context: {} }));
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 800 },
  ]) {
    const page = await open(viewport);
    assert.equal(
      (await page.goto(base + "/substrate", { waitUntil: "networkidle" })).status(),
      200,
    );
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), "Substrate · Second Thought");
    assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
    assert.equal(await page.locator(".substrate-model").count(), 3);
    assert.equal(await page.locator(".substrate-signal-list > div").count(), 9);
    assert.ok(
      await page.evaluate(() =>
        ["Substrate Inter", "Substrate Lora", "Substrate Fraunces", "Substrate Mono"].every(
          (font) =>
            [...document.fonts].some(
              (face) => face.family.replaceAll('"', "") === font && face.status === "loaded",
            ),
        ),
      ),
    );
    await assertNoOverflow(page);
    await page.screenshot({
      path: join(output, "substrate-" + viewport.width + ".png"),
      fullPage: true,
    });
    const endpoint = page.locator(".substrate-model-endpoint").first();
    await endpoint.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert.equal(await endpoint.evaluate((element) => element.open), true);
    assert.match(await endpoint.locator("code").innerText(), /Nemotron-3_5-Lightning/);
    await page.keyboard.press("Space");
    assert.equal(await endpoint.evaluate((element) => element.open), false);
    assert.notEqual(
      await endpoint
        .locator("summary")
        .evaluate((element) => getComputedStyle(element).outlineStyle),
      "none",
    );
    await page.getByRole("link", { name: "Explore the substrate", exact: false }).click();
    const heading = await page.locator("#models-heading").boundingBox();
    const nav = await page.locator(".substrate-nav").boundingBox();
    assert.ok(heading.y >= nav.y + nav.height, "Anchor should clear sticky navigation.");
    if (viewport.width === 390) {
      await page.getByRole("button", { name: "Call Lightning", exact: true }).click();
      await page
        .locator("#lightning-result")
        .getByText("NEBIUS_API_KEY is not set.", { exact: false })
        .waitFor();
      await page.getByRole("button", { name: "Call Tavily", exact: true }).click();
      await page
        .locator("#tavily-result")
        .getByText("TAVILY_API_KEY is not set.", { exact: false })
        .waitFor();
      await assertNoOverflow(page);
      passed("Real server missing-key responses on mobile");
    }
    if (viewport.width === 1440) {
      await page.goto(base + "/substrate", { waitUntil: "networkidle" });
      const axePath = process.env.SUBSTRATE_AXE_PATH;
      if (axePath) {
        await page.addScriptTag({ path: axePath });
        const axe = await page.evaluate(async () =>
          window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          }),
        );
        writeFileSync(join(output, "accessibility.json"), JSON.stringify(axe, null, 2));
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        passed("Automated WCAG accessibility scan");
      }
      await page.emulateMedia({ forcedColors: "active" });
      assert.equal(
        await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor),
        "auto",
      );
      await page.emulateMedia({ forcedColors: "none" });
      assert.notEqual(
        await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor),
        "auto",
      );
      passed("Forced-colors and global scrollbar behavior");
    }
    passed("Layout, local fonts, endpoint keyboard disclosure, anchor at " + viewport.width + "px");
    await page.close();
  }

  const page = await open({ width: 1280, height: 900 });
  let statusUnavailable = false;
  let lightningMode = "success";
  let tavilyMode = "results";
  let lightningCalls = 0;
  const longFailure = "The service could not complete this test request. ".repeat(80);
  let gate = null;
  await page.route("**/_serverFn/**", async (route) => {
    const encoded = new URL(route.request().url()).pathname.split("/").pop();
    const descriptor = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (descriptor.export.startsWith("substrateStatus")) {
      if (statusUnavailable) {
        await route.fulfill({
          status: 503,
          contentType: "text/plain",
          body: "Status service unavailable",
        });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        headers: { "x-tss-serialized": "true" },
        body: response({ tokenFactory: true, tavily: true }),
      });
    } else if (descriptor.export.startsWith("probeLightning")) {
      lightningCalls++;
      if (lightningMode === "transport-error") {
        await route.abort("failed");
        return;
      }
      if (gate) await gate.promise;
      await route.fulfill({
        contentType: "application/json",
        headers: { "x-tss-serialized": "true" },
        body: response(
          lightningMode === "success"
            ? {
                ok: true,
                model: "test-lightning",
                text: "calibration holds",
                usage: { prompt_tokens: 5, completion_tokens: 2 },
              }
            : {
                ok: false,
                reason: lightningMode === "long" ? longFailure : "Service unavailable. Try again.",
              },
        ),
      });
    } else if (descriptor.export.startsWith("probeTavily")) {
      await route.fulfill({
        contentType: "application/json",
        headers: { "x-tss-serialized": "true" },
        body: response({
          ok: true,
          results:
            tavilyMode === "results"
              ? [{ title: "Test evidence", url: "https://example.com/evidence" }]
              : [],
        }),
      });
    } else await route.continue();
  });
  await page.goto(base + "/substrate", { waitUntil: "networkidle" });
  await page.getByText("Key present", { exact: true }).first().waitFor();
  const lightningButton = page.getByRole("button", { name: "Call Lightning", exact: true });
  const tavilyButton = page.getByRole("button", { name: "Call Tavily", exact: true });
  await lightningButton.scrollIntoViewIfNeeded();
  const idle = await lightningButton.boundingBox();
  gate = deferred();
  await lightningButton.evaluate((button) => {
    button.click();
    button.click();
  });
  const pendingButton = page.getByRole("button", { name: "Calling Lightning", exact: true });
  await pendingButton.waitFor();
  assert.equal(await pendingButton.isDisabled(), true);
  assert.equal(await tavilyButton.isDisabled(), true);
  assert.equal(await pendingButton.getAttribute("aria-busy"), "true");
  const pending = await pendingButton.boundingBox();
  assert.equal(pending.width, idle.width);
  assert.equal(pending.height, idle.height);
  assert.equal(
    await pendingButton
      .locator(".substrate-loader")
      .evaluate((element) => getComputedStyle(element).animationName),
    "none",
  );
  await page.locator("#lightning-result").getByText("Waiting for response").waitFor();
  gate.resolve();
  gate = null;
  await page.locator("#lightning-result").getByText("calibration holds", { exact: true }).waitFor();
  await page.locator("#lightning-result").getByText("5 input / 2 output tokens").waitFor();
  assert.equal(lightningCalls, 1);
  passed(
    "Pending feedback, duplicate prevention, stable geometry, reduced motion, and mocked inference success",
  );
  lightningMode = "failure";
  await lightningButton.click();
  await page.locator("#lightning-result").getByText("Service unavailable. Try again.").waitFor();
  assert.equal(await lightningButton.isEnabled(), true);
  lightningMode = "long";
  await lightningButton.click();
  await page.locator("#lightning-result").getByText(longFailure.trim(), { exact: true }).waitFor();
  assert.equal(
    await page
      .locator("#lightning-result")
      .evaluate((element) => element.scrollHeight > element.clientHeight),
    true,
  );
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.id), "lightning-result");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => document.getElementById("lightning-result").scrollTop > 0);
  passed("Long service output is readable by keyboard");
  lightningMode = "transport-error";
  await lightningButton.click();
  await page
    .locator("#lightning-result")
    .getByText("Connection unavailable", { exact: true })
    .waitFor();
  assert.equal(await lightningButton.isEnabled(), true);
  lightningMode = "success";
  await lightningButton.click();
  await page.locator("#lightning-result").getByText("calibration holds", { exact: true }).waitFor();
  passed("Mocked inference and transport failures with retry recovery");
  await tavilyButton.click();
  await page.locator("#tavily-result").getByText("Test evidence", { exact: true }).waitFor();
  tavilyMode = "empty";
  await tavilyButton.click();
  await page
    .locator("#tavily-result")
    .getByText("No results were returned", { exact: false })
    .waitFor();
  passed("Mocked search success and empty result");
  statusUnavailable = true;
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Status unavailable", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("Key needed", { exact: true }).count(), 0);
  statusUnavailable = false;
  await page.getByRole("button", { name: "Retry status", exact: false }).click();
  await page.getByText("Key present", { exact: true }).first().waitFor();
  assert.equal(await page.getByRole("button", { name: "Retry status", exact: false }).count(), 0);
  passed("Failed status request is truthful and retryable");
  gate = deferred();
  await lightningButton.click();
  await page.getByRole("button", { name: "Calling Lightning", exact: true }).waitFor();
  await page.getByRole("link", { name: "Evaluation lab", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Model size is not a cognitive policy. This battery measures the difference.",
    })
    .waitFor();
  gate.resolve();
  gate = null;
  assert.equal(await page.locator(".substrate-shell").count(), 0);
  assert.equal(await page.locator("#lightning-result").count(), 0);
  await page.getByRole("link", { name: "Bench", exact: true }).click();
  await page.getByRole("heading", { name: "Second Thought is a cognitive runtime." }).waitFor();
  assert.equal(await page.locator(".substrate-shell").count(), 0);
  passed("In-flight navigation and original sibling route appearance");
  assert.deepEqual(pageErrors, []);
  const result = {
    base,
    checks,
    passed: checks.length,
    pageErrors,
    blockedExternalAssets: [...failedAssets],
    externalSuccess: "mocked; live credentials were not used",
  };
  writeFileSync(join(output, "results.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
