import { useEffect, useState } from "react";
import { WEIGHTS } from "@/lib/nmm/signals";
import { TAVILY, TIERS } from "@/lib/nmm/models";
import { probeLightning, probeTavily, substrateStatus } from "@/lib/nmm/probe";
import type { Tier } from "@/lib/nmm/types";

type Status = { tokenFactory: boolean; tavily: boolean };
type LightningProbe =
  | { ok: true; model: string; text: string; usage: { prompt_tokens?: number; completion_tokens?: number } | null }
  | { ok: false; reason: string };
type TavilyProbe = { ok: true; results: { title: string; url: string }[] } | { ok: false; reason: string };

export function SubstrateView() {
  const [status, setStatus] = useState<Status | null>(null);
  const [lightning, setLightning] = useState<LightningProbe | null>(null);
  const [tavily, setTavily] = useState<TavilyProbe | null>(null);
  const [busy, setBusy] = useState<"lightning" | "tavily" | null>(null);

  useEffect(() => {
    let cancel = false;
    substrateStatus()
      .then((value) => {
        if (!cancel) setStatus(value);
      })
      .catch(() => {
        if (!cancel) setStatus({ tokenFactory: false, tavily: false });
      });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <p className="text-xs tracking-widest text-amber uppercase">Substrate</p>
        <h1 className="mt-2 font-display text-3xl text-fg sm:text-4xl">
          NMM underneath. Nemotron as a resource, not a default.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Second Thought does not read a model’s private state. Token Factory returns observable inference.
          The calibration gap is computed from the packet, the probes, and the disagreement in front of us.
          Metacognition here means changing the reasoning strategy before the error is allowed to become the answer.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(TIERS) as Tier[]).map((tier) => {
          const model = TIERS[tier];
          return (
            <article key={tier} className="border border-line bg-panel p-4">
              <p className="text-xs tracking-widest text-amber uppercase">{model.params}</p>
              <h2 className="mt-2 font-display text-2xl text-fg">{model.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{model.role}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted">Endpoint</dt>
                  <dd className="mt-1 break-all text-fg">{model.id}</dd>
                </div>
                <div>
                  <dt className="text-muted">Context</dt>
                  <dd className="mt-1 text-fg">{model.context}</dd>
                </div>
                <div>
                  <dt className="text-muted">Price / 1M</dt>
                  <dd className="mt-1 tabular-nums text-fg">${model.inPerM.toFixed(2)} in · ${model.outPerM.toFixed(2)} out</dd>
                </div>
                <div>
                  <dt className="text-muted">Listed throughput</dt>
                  <dd className="mt-1 tabular-nums text-fg">{model.tokPerSec} tok/s</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <article className="border border-amber bg-panel p-4">
        <p className="text-xs tracking-widest text-amber uppercase">Epistemic acquisition</p>
        <h2 className="mt-2 font-display text-2xl text-fg">{TAVILY.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{TAVILY.role}</p>
      </article>

      <section className="border border-line bg-panel p-4">
        <h2 className="font-display text-2xl text-fg">What the gap is allowed to see</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {WEIGHTS.map((item) => (
            <li key={item.key} className="flex items-baseline justify-between gap-3 border-b border-line py-2">
              <span className="text-sm text-fg">{item.label}</span>
              <span className="text-xs tabular-nums text-muted">weight {item.w.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          Contradiction between evidence, support coverage, untested assumptions, instability under leave-one-out probes,
          evidence age, hypothesis competition, task risk, failed verification, and reasoning that repeats without information gain.
          If a signal cannot be computed from the packet and the trace, it is not in the gap.
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="border border-line bg-ink p-4">
          <h2 className="font-display text-2xl text-fg">Token Factory</h2>
          <p className="mt-2 text-sm text-muted">
            OpenAI-compatible chat completions at api.tokenfactory.nebius.com. Status:{" "}
            {status ? (status.tokenFactory ? "key present" : "key absent") : "checking"}.
          </p>
          <button
            type="button"
            className="mt-4 h-11 bg-amber px-4 text-sm text-ink disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => {
              setBusy("lightning");
              setLightning(null);
              probeLightning()
                .then(setLightning)
                .catch((error: unknown) => setLightning({ ok: false, reason: error instanceof Error ? error.message : "Probe failed." }))
                .finally(() => setBusy(null));
            }}
          >
            {busy === "lightning" ? "Calling Lightning" : "Call Lightning"}
          </button>
          {lightning ? <ProbeResult body={lightning.ok ? `${lightning.model}\n${lightning.text}\n${JSON.stringify(lightning.usage)}` : lightning.reason} /> : null}
        </article>
        <article className="border border-line bg-ink p-4">
          <h2 className="font-display text-2xl text-fg">Tavily</h2>
          <p className="mt-2 text-sm text-muted">
            Search is a regulatory action, not a sidebar. Status: {status ? (status.tavily ? "key present" : "key absent") : "checking"}.
          </p>
          <button
            type="button"
            className="mt-4 h-11 border border-amber px-4 text-sm text-amber disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => {
              setBusy("tavily");
              setTavily(null);
              probeTavily()
                .then(setTavily)
                .catch((error: unknown) => setTavily({ ok: false, reason: error instanceof Error ? error.message : "Probe failed." }))
                .finally(() => setBusy(null));
            }}
          >
            {busy === "tavily" ? "Calling Tavily" : "Call Tavily"}
          </button>
          {tavily ? (
            <ProbeResult
              body={
                tavily.ok
                  ? tavily.results.map((item) => `${item.title}\n${item.url}`).join("\n\n") || "No results."
                  : tavily.reason
              }
            />
          ) : null}
        </article>
      </section>

      <section className="max-w-3xl">
        <h2 className="font-display text-2xl text-fg">Serverless Jobs</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The evaluation lab is the job: the same battery, the same metrics, run off the request path when the trial count or the live model calls no longer belong in a browser.
          Lightning when the state is already calm. Super when the gap is opening. Ultra when contradiction, incomplete evidence, unresolved competition, and consequence line up.
          Then back down. That allocation is the feedback the stack is there to measure.
        </p>
      </section>
    </div>
  );
}

function ProbeResult({ body }: { body: string }) {
  return <pre className="mt-4 max-h-48 overflow-auto border border-line bg-panel p-3 text-xs leading-relaxed whitespace-pre-wrap text-fg">{body}</pre>;
}
