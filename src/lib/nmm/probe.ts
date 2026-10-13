import { createServerFn } from "@tanstack/react-start";
import { TIERS } from "./models";

export const substrateStatus = createServerFn({ method: "GET" }).handler(async () => {
  return {
    tokenFactory: Boolean(process.env.NEBIUS_API_KEY),
    tavily: Boolean(process.env.TAVILY_API_KEY),
  };
});

export const probeLightning = createServerFn({ method: "POST" }).handler(async () => {
  const key = process.env.NEBIUS_API_KEY;
  if (!key) {
    return {
      ok: false as const,
      reason: "NEBIUS_API_KEY is not set. The bench is running the closed-world harness, priced at Token Factory rates.",
    };
  }
  const model = TIERS.lightning.id;
  try {
    const response = await fetch("https://api.tokenfactory.nebius.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a connectivity probe. Do not provide reasoning, analysis, or explanations. Return exactly CALIBRATION_OK.",
          },
          { role: "user", content: "Return the health token now." },
        ],
        max_tokens: 8,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false as const, reason: `Token Factory ${response.status}: ${text.slice(0, 280)}` };
    }
    const json = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
      model?: string;
    };
    return {
      ok: true as const,
      model: json.model ?? model,
      text: "Connection verified. Lightning returned a successful response.",
      usage: json.usage ?? null,
    };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Error ? error.message : "Token Factory request failed." };
  }
});

export const probeTavily = createServerFn({ method: "POST" }).handler(async () => {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return {
      ok: false as const,
      reason: "TAVILY_API_KEY is not set. MRL still decides when a search is warranted. The call arms when the key is present.",
    };
  }
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query: "targeted customs examination HS code port berth dwell time",
        max_results: 2,
        search_depth: "basic",
        include_answer: false,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false as const, reason: `Tavily ${response.status}: ${text.slice(0, 280)}` };
    }
    const json = JSON.parse(text) as { results?: { title?: string; url?: string }[] };
    const results = (json.results ?? []).slice(0, 2).map((item) => ({
      title: item.title ?? "Untitled",
      url: item.url ?? "",
    }));
    return { ok: true as const, results };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Error ? error.message : "Tavily request failed." };
  }
});
