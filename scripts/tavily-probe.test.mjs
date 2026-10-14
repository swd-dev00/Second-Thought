import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the actual handler with TanStack's transport builder stubbed. The VM
// receives a test-only environment and fetch, so no real key or network is used.
const source = readFileSync(new URL("../src/lib/nmm/probe.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadProbe(fetchImpl, key = "test-only-tavily-key") {
  const exports = {};
  runInNewContext(compiled, {
    exports,
    process: { env: key === null ? {} : { TAVILY_API_KEY: key } },
    fetch: fetchImpl,
    AbortSignal,
    Error,
    require(name) {
      if (name === "@tanstack/react-start") {
        return { createServerFn: () => ({ handler: (handler) => handler }) };
      }
      if (name === "./models") return { TIERS: {} };
      throw new Error(`Unexpected handler import: ${name}`);
    },
  });
  return async () => JSON.parse(JSON.stringify(await exports.probeTavily()));
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("Tavily health check returns only a connection receipt, never search content", async () => {
  const probe = loadProbe(async (url, options) => {
    assert.equal(url, "https://api.tavily.com/search");
    assert.equal(options.method, "POST");
    const request = JSON.parse(options.body);
    assert.equal(request.api_key, "test-only-tavily-key");
    assert.equal(request.max_results, 2);
    assert.equal(request.include_answer, false);
    assert.ok(options.signal instanceof AbortSignal);
    return jsonResponse({
      answer: "Provider answer must remain server-side",
      results: [
        {
          title: "Private title",
          url: "https://example.invalid/private",
          content: "Private content",
        },
        { title: "Second title", url: "https://example.invalid/second", score: 0.99 },
      ],
    });
  });
  assert.deepEqual(await probe(), { ok: true, resultCount: 2 });
});

test("Tavily receipt reports an empty successful search truthfully", async () => {
  const probe = loadProbe(async () => jsonResponse({ results: [] }));
  assert.deepEqual(await probe(), { ok: true, resultCount: 0 });
});

test("Tavily receipt handles an absent result list without inventing evidence", async () => {
  const probe = loadProbe(async () => jsonResponse({}));
  assert.deepEqual(await probe(), { ok: true, resultCount: 0 });
});

test("Tavily health check does not call the provider without a key", async () => {
  const probe = loadProbe(() => assert.fail("fetch must not run without a key"), null);
  const receipt = await probe();
  assert.equal(receipt.ok, false);
  assert.match(receipt.reason, /TAVILY_API_KEY is not set/);
});

test("Tavily malformed result list is a failed check, not a successful receipt", async () => {
  const probe = loadProbe(async () => jsonResponse({ results: "provider content" }));
  assert.deepEqual(await probe(), {
    ok: false,
    reason: "Tavily returned an invalid search response.",
  });
});

test("Tavily provider errors retain their status and bounded message", async () => {
  const detail = "Quota exhausted. ".repeat(50);
  const probe = loadProbe(async () => new Response(detail, { status: 429 }));
  assert.deepEqual(await probe(), { ok: false, reason: `Tavily 429: ${detail.slice(0, 280)}` });
});

test("Tavily malformed JSON and transport failures do not become success", async () => {
  const badJson = loadProbe(async () => new Response("not-json"));
  assert.equal((await badJson()).ok, false);
  const unavailable = loadProbe(async () => {
    throw new Error("Test transport unavailable");
  });
  assert.deepEqual(await unavailable(), { ok: false, reason: "Test transport unavailable" });
});
