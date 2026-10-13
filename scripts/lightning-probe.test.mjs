import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Run the actual handler in an isolated test-only environment. Stubbing the
// transport builder preserves handler behavior without using a real API key.
const source = readFileSync(new URL("../src/lib/nmm/probe.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const model = "test-lightning-model";
const receiptText = "Connection verified. Lightning returned a successful response.";

function loadProbe(fetchImpl, key = "test-only-nebius-key") {
  const exports = {};
  runInNewContext(compiled, {
    exports,
    process: { env: key === null ? {} : { NEBIUS_API_KEY: key } },
    fetch: fetchImpl,
    AbortSignal,
    Error,
    require(name) {
      if (name === "@tanstack/react-start") {
        return { createServerFn: () => ({ handler: (handler) => handler }) };
      }
      if (name === "./models") return { TIERS: { lightning: { id: model } } };
      throw new Error(`Unexpected handler import: ${name}`);
    },
  });
  return async () => JSON.parse(JSON.stringify(await exports.probeLightning()));
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("Lightning success receipt excludes raw model messages and reasoning", async () => {
  const usage = { prompt_tokens: 17, completion_tokens: 8 };
  const probe = loadProbe(async () =>
    jsonResponse({
      model: "provider-lightning-model",
      choices: [
        {
          message: {
            content: "Here's a thinking process: private model output",
            reasoning_content: "Private reasoning must remain server-side",
            reasoning: "Additional private analysis",
          },
        },
      ],
      reasoning: "Top-level private model analysis",
      usage,
    }),
  );
  assert.deepEqual(await probe(), {
    ok: true,
    model: "provider-lightning-model",
    text: receiptText,
    usage,
  });
});

test("Lightning health-check request uses a constrained instruction and token budget", async () => {
  const probe = loadProbe(async (url, options) => {
    assert.equal(url, "https://api.tokenfactory.nebius.com/v1/chat/completions");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-only-nebius-key");
    assert.equal(options.headers["Content-Type"], "application/json");
    const request = JSON.parse(options.body);
    assert.equal(request.model, model);
    assert.equal(request.max_tokens, 8);
    assert.equal(request.temperature, 0);
    assert.deepEqual(request.messages, [
      {
        role: "system",
        content:
          "You are a connectivity probe. Do not provide reasoning, analysis, or explanations. Return exactly CALIBRATION_OK.",
      },
      { role: "user", content: "Return the health token now." },
    ]);
    assert.ok(options.signal instanceof AbortSignal);
    return jsonResponse({ choices: [{ message: { content: "CALIBRATION_OK" } }] });
  });
  assert.equal((await probe()).text, receiptText);
});

test("Lightning receipt retains a fallback model and nullable usage without raw message text", async () => {
  const probe = loadProbe(async () => jsonResponse({ choices: [] }));
  assert.deepEqual(await probe(), { ok: true, model, text: receiptText, usage: null });
});

test("Lightning health check makes no provider request without a key", async () => {
  const probe = loadProbe(() => assert.fail("fetch must not run without a key"), null);
  const receipt = await probe();
  assert.equal(receipt.ok, false);
  assert.match(receipt.reason, /NEBIUS_API_KEY is not set/);
});

test("Lightning provider errors retain their status and bounded message", async () => {
  const detail = "Provider quota exhausted. ".repeat(50);
  const probe = loadProbe(async () => new Response(detail, { status: 429 }));
  assert.deepEqual(await probe(), {
    ok: false,
    reason: `Token Factory 429: ${detail.slice(0, 280)}`,
  });
});

test("Lightning malformed JSON does not become a verified connection receipt", async () => {
  const probe = loadProbe(async () => new Response("not-json"));
  assert.equal((await probe()).ok, false);
});

test("Lightning transport failures retain useful errors and a fallback for non-Error failures", async () => {
  const unavailable = loadProbe(async () => {
    throw new Error("Test transport unavailable");
  });
  assert.deepEqual(await unavailable(), { ok: false, reason: "Test transport unavailable" });
  const unknownFailure = loadProbe(async () => {
    throw "test failure";
  });
  assert.deepEqual(await unknownFailure(), { ok: false, reason: "Token Factory request failed." });
});
