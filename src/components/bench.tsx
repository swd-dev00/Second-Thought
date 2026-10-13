import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BenchHero } from "@/components/bench-hero";
import { CANONICAL } from "@/lib/nmm/trials";
import { runTrial } from "@/lib/nmm/engine";
import { substrateStatus } from "@/lib/nmm/probe";
import { WEIGHTS } from "@/lib/nmm/signals";
import { TIERS } from "@/lib/nmm/models";
import { ccg, money, pct, tokens } from "@/lib/nmm/format";
import type { ArmResult, Signals, TraceEvent, TrialRun } from "@/lib/nmm/types";

const SPEEDS = [1, 2, 4] as const;

function endOf(run: TrialRun): number {
  const last = (arm: ArmResult) => arm.events.reduce((m, event) => Math.max(m, event.t), 0);
  return Math.max(last(run.baseline), last(run.regulated), 1);
}

function visible(events: TraceEvent[], t: number): TraceEvent[] {
  return events.filter((event) => event.t <= t);
}

function latestRead(events: TraceEvent[]) {
  return [...events].reverse().find((event) => event.type === "read");
}

function policyOf(trialId: string): string {
  if (trialId === "berth-7")
    return "Escalate through the model family when deeper reasoning and new evidence can materially change the answer.";
  if (trialId === "yield-440")
    return "Stop when the evidence cannot discriminate and more inference cannot resolve the uncertainty.";
  return "Stay on Lightning when the evidence is already sufficient to commit.";
}

export function Bench() {
  const [trialId, setTrialId] = useState(CANONICAL[0]!.id);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [playing, setPlaying] = useState(true);
  const [playhead, setPlayhead] = useState(0);
  const [runtime, setRuntime] = useState<{ tokenFactory: boolean; tavily: boolean } | null>(null);
  const run = useMemo(
    () => runTrial(CANONICAL.find((trial) => trial.id === trialId) ?? CANONICAL[0]!),
    [trialId],
  );
  const end = endOf(run);
  const done = playhead >= end - 1;

  useEffect(() => {
    substrateStatus()
      .then(setRuntime)
      .catch(() => setRuntime({ tokenFactory: false, tavily: false }));
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("trial");
    if (requested && CANONICAL.some((trial) => trial.id === requested)) {
      setTrialId(requested);
    }
  }, []);

  useEffect(() => {
    setPlayhead(0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPlaying(!reduce);
    if (reduce) setPlayhead(end);
  }, [trialId, end]);

  useEffect(() => {
    if (!playing || done) return;
    let frame = 0;
    let last = performance.now();
    const rate = end / (15000 / speed);
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      setPlayhead((prev) => Math.min(end, prev + dt * rate));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, done, end, speed, trialId]);

  const baseEvents = visible(run.baseline.events, playhead);
  const regEvents = visible(run.regulated.events, playhead);
  const read = latestRead(regEvents);
  const reads = regEvents.filter((event) => event.type === "read");
  const initial = run.trial.evidence.filter((item) => item.availability === "initial");
  const outside = run.trial.evidence.filter((item) => item.availability === "retrievable").length;

  const jump = (dir: 1 | -1) => {
    const marks = [...run.baseline.events, ...run.regulated.events]
      .map((event) => event.t)
      .sort((a, b) => a - b);
    if (dir > 0) {
      const next = marks.find((mark) => mark > playhead + 8);
      setPlayhead(next ?? end);
    } else {
      const prev = [...marks].reverse().find((mark) => mark < playhead - 8);
      setPlayhead(prev ?? 0);
    }
    setPlaying(false);
  };

  return (
    <div className="bench-experience">
      <BenchHero
        run={run}
        events={regEvents}
        progress={playhead / end}
        complete={done}
        onRun={() => {
          setTrialId("berth-7");
          setPlayhead(0);
          setPlaying(true);
          document.getElementById("bench-workbench")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
        }}
      />
      <div className="bench-content">
        <div className="bench-live-strip">
          <RuntimeStrip status={runtime} />
        </div>
        <section className="bench-chapters" aria-labelledby="bench-trials-heading">
          <div className="bench-chapters-head">
            <div>
              <span className="bench-chapters-kicker">
                THREE TRIALS / THREE REGULATORY DECISIONS
              </span>
              <h2 id="bench-trials-heading">Intelligence should know when.</h2>
            </div>
            <p>
              Escalate when new evidence can change the answer. Stop when it cannot. Stay small when
              it is enough.
            </p>
          </div>
          <div className="bench-chapter-grid">
            {CANONICAL.map((trial, index) => (
              <button
                key={trial.id}
                type="button"
                className={clsx("bench-chapter", trial.id === trialId && "is-active")}
                onClick={() => {
                  setTrialId(trial.id);
                  document.getElementById("bench-workbench")?.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                      ? "auto"
                      : "smooth",
                  });
                }}
                aria-pressed={trial.id === trialId}
              >
                <span className="bench-chapter-index">
                  0{index + 1} / {trial.kicker}
                </span>
                <strong>{trial.title}</strong>
                <small>{policyOf(trial.id)}</small>
                <ArrowUpRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
        <section
          id="bench-workbench"
          className="bench-workbench"
          aria-labelledby="bench-workbench-heading"
        >
          <div className="bench-workbench-head">
            <div>
              <span className="bench-workbench-kicker">THE RUNTIME / INTERACTIVE REPLAY</span>
              <h2 id="bench-workbench-heading">Watch the intervention.</h2>
            </div>
            <p>
              Two reasoning paths. One evidence packet. Follow the actual controller trace, then
              inspect the verdict.
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {CANONICAL.map((trial) => (
              <TrialButton
                key={trial.id}
                active={trial.id === trialId}
                onClick={() => setTrialId(trial.id)}
                kicker={trial.kicker}
                title={trial.title}
              />
            ))}
          </div>

          <div className="bench-playback-layout grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <aside className="bench-playback-side hidden lg:flex lg:flex-col lg:gap-2">
              {CANONICAL.map((trial) => (
                <TrialButton
                  key={trial.id}
                  active={trial.id === trialId}
                  onClick={() => setTrialId(trial.id)}
                  kicker={trial.kicker}
                  title={trial.title}
                />
              ))}
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Closed-world stress trials. Ground truth is sealed until both arms finish. Numbers
                are the harness, not a slide.
              </p>
            </aside>

            <div className="flex min-w-0 flex-col gap-4">
              <section className="bench-packet border border-line bg-panel p-4">
                <p className="text-xs tracking-widest text-muted uppercase">{run.trial.kicker}</p>
                <h2 className="mt-2 font-display text-2xl text-fg">{run.trial.title}</h2>
                <p className="mt-2 font-display text-xl text-fg">{run.trial.question}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{run.trial.brief}</p>
                <div className="mt-4 border-l-2 border-amber pl-3">
                  <p className="text-[11px] tracking-widest text-muted uppercase">
                    NMM allocation policy
                  </p>
                  <p className="mt-1 text-sm text-fg">{policyOf(run.trial.id)}</p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {initial.map((item) => (
                    <article key={item.id} className="border border-line bg-ink px-3 py-2">
                      <p className="text-xs text-amber">{item.source}</p>
                      <p className="mt-1 text-sm text-fg">{item.text}</p>
                      <p className="mt-1 text-xs text-muted">Age {item.ageDays}d</p>
                    </article>
                  ))}
                </div>
                {outside > 0 ? (
                  <p className="mt-3 text-xs text-muted">
                    {outside} observation{outside === 1 ? "" : "s"} stay outside the packet until
                    the regulatory layer asks for them.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-muted">
                    Nothing outside this packet can separate the hypotheses.
                  </p>
                )}
              </section>

              <div className="bench-progress-track h-1 overflow-hidden bg-panel">
                <div
                  className="bench-progress-fill h-full bg-amber transition-[width] duration-150"
                  style={{ width: `${Math.min(100, (playhead / end) * 100)}%` }}
                />
              </div>

              <div className="bench-toolbar flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="h-11 bg-amber px-4 text-sm text-ink"
                  onClick={() => {
                    setPlayhead(0);
                    setPlaying(true);
                  }}
                >
                  {done ? "Replay" : playing ? "Restart" : "Play"}
                </button>
                <button
                  type="button"
                  className="h-11 border border-line px-4 text-sm"
                  onClick={() => setPlaying((value) => !value)}
                >
                  {playing && !done ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  className="h-11 border border-line px-3 text-sm"
                  onClick={() => jump(-1)}
                  aria-label="Step back"
                >
                  Step back
                </button>
                <button
                  type="button"
                  className="h-11 border border-line px-3 text-sm"
                  onClick={() => jump(1)}
                  aria-label="Step forward"
                >
                  Step
                </button>
                <div className="flex h-11 border border-line">
                  {SPEEDS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={clsx(
                        "px-3 text-sm",
                        speed === value ? "bg-paper text-ink" : "text-muted",
                      )}
                      onClick={() => setSpeed(value)}
                    >
                      {value}×
                    </button>
                  ))}
                </div>
                <p className="ml-auto text-xs text-muted tabular-nums">
                  {done ? "Trace complete" : "Running"}
                </p>
              </div>

              <InterventionRail events={regEvents} />

              <div className="bench-comparison grid gap-3 lg:grid-cols-2">
                <Pane
                  tone="baseline"
                  kicker="Baseline"
                  title={TIERS.ultra.name}
                  detail="Unregulated monologue. Salience anchoring. No retrieval. No abstention."
                  events={baseEvents}
                  liveTier="ultra"
                />
                <Pane
                  tone="regulated"
                  kicker="Second Thought"
                  title="Regulated Nemotron"
                  detail="CCG from observable signals. MRL chooses the tier, the tool, or the stop."
                  events={regEvents}
                  liveTier={read && read.type === "read" ? read.tier : "lightning"}
                />
              </div>

              {done ? <OutcomeSplit run={run} /> : null}
              {done ? <CaseMechanism run={run} /> : null}

              <Instrument
                read={read && read.type === "read" ? read : null}
                history={reads.flatMap((event) => (event.type === "read" ? [event.ccg] : []))}
              />

              {done ? <Verdict run={run} /> : null}
            </div>
          </div>
        </section>
        <div className="bench-workbench-tail">
          <p>TRIAL REPLAY / NMM · CCG · MRL / NO FABRICATED LIVE TELEMETRY</p>
          <Link to="/substrate">
            Inspect the substrate <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function RuntimeStrip({ status }: { status: { tokenFactory: boolean; tavily: boolean } | null }) {
  const cells = [
    { label: "NMM controller", value: "ACTIVE", active: true },
    {
      label: "Nebius Token Factory",
      value: status === null ? "CHECKING" : status.tokenFactory ? "ARMED" : "KEY NEEDED",
      active: Boolean(status?.tokenFactory),
    },
    {
      label: "Tavily acquisition",
      value: status === null ? "CHECKING" : status.tavily ? "ARMED" : "KEY NEEDED",
      active: Boolean(status?.tavily),
    },
  ];

  return (
    <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-3">
      {cells.map((cell) => (
        <div key={cell.label} className="flex items-center justify-between gap-3 bg-ink px-3 py-2">
          <span className="text-[11px] text-muted">{cell.label}</span>
          <span
            className={clsx(
              "text-[11px] tracking-wider",
              cell.active ? "text-amber" : "text-muted",
            )}
          >
            {cell.value}
          </span>
        </div>
      ))}
    </div>
  );
}

type CaseMechanismCopy = { title: string; lead: string; items: Array<readonly [string, string]> };
type InterventionStep = {
  key: string;
  label: string;
  detail: string;
  tone: "read" | "action" | "terminal";
};

function CaseMechanism({ run }: { run: TrialRun }) {
  const copy: CaseMechanismCopy =
    run.trial.id === "berth-7"
      ? {
          title: "Why Second Thought changed course",
          lead: "The first answer was plausible, but the evidence did not support committing to it.",
          items: [
            [
              "Challenge",
              "The labor story depended on a stale, high-salience bulletin that conflicted with current gate activity.",
            ],
            [
              "Acquire",
              "The packet could not separate crane failure from a customs hold, so NMM requested the missing observations.",
            ],
            [
              "Allocate",
              "The surviving hypotheses still competed, so cognition moved up the Nemotron stack only as needed.",
            ],
            [
              "Commit",
              "The combined commodity and berth evidence separated the targeted exam hypothesis.",
            ],
          ],
        }
      : run.trial.id === "yield-440"
        ? {
            title: "Why Second Thought refused to guess",
            lead: "The available observations support both causes. More reasoning cannot manufacture the missing experiment.",
            items: [
              ["Detect", "The competing hypotheses remain symmetric under the available evidence."],
              [
                "Stop",
                "NMM recognizes that another model pass cannot resolve an information deficit.",
              ],
              [
                "Name the gap",
                "The system identifies the discriminating control needed before a causal answer is warranted.",
              ],
              [
                "Halt",
                "Abstention is the correct outcome because the evidence is underdetermined.",
              ],
            ],
          }
        : {
            title: "Why Second Thought stayed small",
            lead: "The evidence is fresh, aligned, and decisive. There is no reason to pay for deeper cognition.",
            items: [
              ["Read", "Three independent observations point in the same direction."],
              ["Measure", "Contradiction and competition remain low while coverage is sufficient."],
              ["Allocate", "Lightning is enough for the evidence state in front of the system."],
              ["Commit", "NMM reaches the supported answer without escalating to Super or Ultra."],
            ],
          };

  return (
    <section className="border border-line bg-panel p-4">
      <p className="text-xs tracking-widest text-amber uppercase">Intervention logic</p>
      <h2 className="mt-2 font-display text-2xl text-fg">{copy.title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{copy.lead}</p>
      <div className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {copy.items.map(([label, detail]) => (
          <article key={label} className="bg-ink p-3">
            <p className="text-xs tracking-wider text-amber uppercase">{label}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InterventionRail({ events }: { events: TraceEvent[] }) {
  const steps: InterventionStep[] = events.flatMap((event): InterventionStep[] => {
    if (event.type === "read") {
      return [
        {
          key: `read-${event.t}`,
          label: TIERS[event.tier].short,
          detail: `CCG ${ccg(event.ccg)}`,
          tone: "read" as const,
        },
      ];
    }
    if (event.type === "action") {
      const label =
        event.action === "challenge"
          ? "CHALLENGE"
          : event.action === "acquire"
            ? "ACQUIRE"
            : event.action === "escalate"
              ? `ESCALATE → ${TIERS[event.tier].short}`
              : "DE-ESCALATE";
      return [
        { key: `${event.action}-${event.t}`, label, detail: event.title, tone: "action" as const },
      ];
    }
    if (event.type === "halt") {
      return [
        {
          key: `halt-${event.t}`,
          label: "HALT",
          detail: "Evidence cannot discriminate",
          tone: "terminal" as const,
        },
      ];
    }
    if (event.type === "commit") {
      return [
        {
          key: `commit-${event.t}`,
          label: "COMMIT",
          detail: event.label,
          tone: "terminal" as const,
        },
      ];
    }
    return [];
  });

  return (
    <section className="bench-recorder border border-line bg-ink p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-widest text-muted uppercase">Cognitive flight recorder</p>
        <p className="text-xs text-muted">
          {steps.length ? "NMM intervention path" : "Awaiting first read"}
        </p>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {steps.length === 0 ? (
          <span className="text-sm text-muted">LIGHTNING will read the incident first.</span>
        ) : null}
        {steps.map((step, index) => (
          <div key={step.key} className="flex shrink-0 items-center gap-2">
            {index > 0 ? <span className="text-muted">→</span> : null}
            <div
              className={clsx(
                "min-w-28 border px-3 py-2",
                step.tone === "action"
                  ? "border-amber bg-panel-2"
                  : step.tone === "terminal"
                    ? "border-oxide bg-panel"
                    : "border-line bg-panel",
              )}
            >
              <p
                className={clsx(
                  "text-xs tracking-wider uppercase",
                  step.tone === "action"
                    ? "text-amber"
                    : step.tone === "terminal"
                      ? "text-oxide"
                      : "text-fg",
                )}
              >
                {step.label}
              </p>
              <p className="mt-1 text-[11px] text-muted">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OutcomeSplit({ run }: { run: TrialRun }) {
  const baselineLabel =
    run.baseline.outcome === "abstained" ? "ABSTAINED" : run.baseline.correct ? "CORRECT" : "WRONG";
  const regulatedLabel =
    run.regulated.outcome === "abstained"
      ? "CORRECT HALT"
      : run.regulated.correct
        ? "CORRECT"
        : "WRONG";

  return (
    <section className="grid overflow-hidden border border-line lg:grid-cols-2">
      <article className="bg-panel p-5 lg:border-r lg:border-line">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">Ultra only</p>
        <p className="mt-3 font-display text-4xl text-fg sm:text-5xl">{run.baseline.answerLabel}</p>
        <p
          className={clsx(
            "mt-2 text-sm font-medium tracking-widest",
            run.baseline.correct ? "text-amber" : "text-oxide",
          )}
        >
          {baselineLabel}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          One large model, one reasoning path, no retrieval decision, no epistemic stop.
        </p>
      </article>
      <article className="bg-ink p-5">
        <p className="text-xs tracking-[0.2em] text-amber uppercase">Second Thought</p>
        <p className="mt-3 font-display text-4xl text-fg sm:text-5xl">
          {run.regulated.answerLabel}
        </p>
        <p
          className={clsx(
            "mt-2 text-sm font-medium tracking-widest",
            run.regulated.correct ? "text-amber" : "text-oxide",
          )}
        >
          {regulatedLabel}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted">MRL interventions</p>
            <p className="mt-1 text-fg tabular-nums">{run.regulated.interventions}</p>
          </div>
          <div>
            <p className="text-muted">Final CCG</p>
            <p className="mt-1 text-fg tabular-nums">{ccg(run.regulated.finalCcg)}</p>
          </div>
        </div>
      </article>
    </section>
  );
}

function TrialButton({
  active,
  onClick,
  kicker,
  title,
}: {
  active: boolean;
  onClick: () => void;
  kicker: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "min-w-40 shrink-0 border px-3 py-3 text-left lg:min-w-0",
        active ? "border-amber bg-panel-2" : "border-line bg-panel hover:border-muted",
      )}
    >
      <span className="block text-xs tracking-widest text-muted uppercase">{kicker}</span>
      <span className="mt-1 block font-display text-xl text-fg">{title}</span>
    </button>
  );
}

function Pane({
  tone,
  kicker,
  title,
  detail,
  events,
  liveTier,
}: {
  tone: "baseline" | "regulated";
  kicker: string;
  title: string;
  detail: string;
  events: TraceEvent[];
  liveTier: "lightning" | "super" | "ultra";
}) {
  return (
    <section
      className={clsx(
        "flex min-w-0 flex-col border bg-panel",
        tone === "regulated" ? "border-amber" : "border-line",
      )}
    >
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-muted uppercase">{kicker}</p>
            <h3 className="mt-1 font-display text-xl text-fg">{title}</h3>
          </div>
          <span
            className={clsx(
              "shrink-0 px-2 py-1 text-xs",
              tone === "regulated" ? "bg-amber text-ink" : "border border-line text-muted",
            )}
          >
            {TIERS[liveTier].short}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p>
      </header>
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto px-4 py-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted">Waiting for the first read.</p>
        ) : null}
        {events.map((event, index) => (
          <EventRow key={`${event.type}-${event.t}-${index}`} event={event} />
        ))}
      </div>
    </section>
  );
}

function EventRow({ event }: { event: TraceEvent }) {
  if (event.type === "monologue") {
    return (
      <article className="border-l border-line pl-3">
        <p className="text-sm text-fg">{event.text}</p>
        <p className="mt-1 text-xs text-muted tabular-nums">
          Confidence {pct(event.confidence)} · {tokens(event.tokens)} tokens · CCG {ccg(event.ccg)}
        </p>
      </article>
    );
  }
  if (event.type === "read") {
    return (
      <article className="border-l border-amber pl-3">
        <p className="text-xs text-amber tabular-nums">
          CCG {ccg(event.ccg)} · {TIERS[event.tier].short}
        </p>
        <p className="mt-1 text-sm text-fg">{event.text}</p>
      </article>
    );
  }
  if (event.type === "action") {
    return (
      <article className="border border-amber bg-ink px-3 py-2">
        <p className="text-xs tracking-widest text-amber uppercase">{event.title}</p>
        <p className="mt-1 text-sm text-fg">{event.detail}</p>
      </article>
    );
  }
  if (event.type === "halt") {
    return (
      <article className="border border-oxide bg-ink px-3 py-3">
        <p className="text-xs tracking-widest text-oxide uppercase">Epistemic halt</p>
        <p className="mt-2 font-display text-lg text-fg">{event.text}</p>
        <p className="mt-2 text-sm text-paper">
          The observation that would resolve it: {event.missing}
        </p>
      </article>
    );
  }
  return (
    <article
      className={clsx("px-3 py-2", event.correct ? "bg-amber text-ink" : "bg-oxide text-ink")}
    >
      <p className="text-xs tracking-widest uppercase">{event.correct ? "Correct" : "Wrong"}</p>
      <p className="mt-1 text-sm">{event.text}</p>
      <p className="mt-1 text-xs tabular-nums">Confidence {pct(event.confidence)}</p>
    </article>
  );
}

function Instrument({
  read,
  history,
}: {
  read: Extract<TraceEvent, { type: "read" }> | null;
  history: number[];
}) {
  const signals = read?.signals;
  return (
    <section className="border border-line bg-panel p-4">
      <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <div>
          <p className="text-xs tracking-widest text-muted uppercase">Cognitive calibration gap</p>
          <p className="mt-1 font-display text-6xl text-amber italic tabular-nums">
            {read ? ccg(read.ccg) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted">Observable. Not a hidden mental state.</p>
        </div>
        <div className="min-w-0">
          <Spark values={history} />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {WEIGHTS.map((item) => (
              <SignalBar
                key={item.key}
                label={item.label}
                weight={item.w}
                value={signals ? signals[item.key as keyof Signals] : 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalBar({ label, weight, value }: { label: string; weight: number; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-fg">{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-1 bg-ink">
        <div className="h-1 bg-amber" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <p className="text-xs text-muted tabular-nums">w {weight.toFixed(2)}</p>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-12 border-b border-line" />;
  }
  const width = 320;
  const height = 48;
  const d = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 4 - value * (height - 8);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-full"
      role="img"
      aria-label="Calibration gap over the trace"
    >
      <path d={d} fill="none" stroke="var(--color-amber)" strokeWidth="2" />
    </svg>
  );
}

function Verdict({ run }: { run: TrialRun }) {
  const base = run.baseline;
  const reg = run.regulated;
  const truth =
    run.trial.truth === "abstain"
      ? "No hypothesis is supported. The correct act is to stop and name the missing observation."
      : (run.trial.hypotheses.find((item) => item.id === run.trial.truth)?.label ??
        run.trial.truth);
  return (
    <section className="border border-line bg-ink p-4">
      <p className="text-xs tracking-widest text-muted uppercase">Measured on this trace</p>
      <p className="mt-2 font-display text-2xl text-fg">Ground truth: {truth}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatBlock
          title="Baseline Ultra"
          result={base}
          extra={[
            { label: "Confidence", value: base.confidence === null ? "—" : pct(base.confidence) },
          ]}
        />
        <StatBlock
          title="Second Thought"
          result={reg}
          accent
          extra={[
            { label: "MRL interventions", value: String(reg.interventions) },
            { label: "Final CCG", value: ccg(reg.finalCcg) },
          ]}
        />
      </div>
    </section>
  );
}

function StatBlock({
  title,
  result,
  extra,
  accent,
}: {
  title: string;
  result: ArmResult;
  extra: { label: string; value: string }[];
  accent?: boolean;
}) {
  const resultLabel =
    result.outcome === "abstained" ? "Abstained" : result.correct ? "Correct" : "Wrong";
  const rows = [
    { label: "Result", value: resultLabel },
    { label: "Answer", value: result.answerLabel },
    { label: "Tokens", value: tokens(result.tokens) },
    { label: "Cost", value: money(result.cost) },
    { label: "Evidence gaps", value: String(result.gaps) },
    { label: "Latency", value: `${(result.latencyMs / 1000).toFixed(1)}s` },
    ...extra,
  ];
  return (
    <div className={clsx("border p-3", accent ? "border-amber" : "border-line")}>
      <h3 className="font-display text-xl text-fg">{title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-muted">{row.label}</dt>
            <dd
              className={clsx(
                "text-sm tabular-nums",
                row.label === "Result" ? (result.correct ? "text-amber" : "text-oxide") : "text-fg",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
