import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Play } from "lucide-react";
import { TIERS } from "@/lib/nmm/models";
import { ccg } from "@/lib/nmm/format";
import type { TraceEvent, TrialRun } from "@/lib/nmm/types";

type BenchHeroProps = {
  run: TrialRun;
  events: TraceEvent[];
  progress: number;
  complete: boolean;
  onRun: () => void;
};

function currentDecision(events: TraceEvent[]): { label: string; detail: string } {
  const latest = [...events]
    .reverse()
    .find((event) => ["action", "commit", "halt", "read"].includes(event.type));
  if (!latest) {
    return { label: "Awaiting evidence", detail: "The regulatory trace begins on the first read." };
  }
  if (latest.type === "read") {
    return {
      label: "Calibration read",
      detail: "CCG " + ccg(latest.ccg) + " · " + TIERS[latest.tier].short,
    };
  }
  if (latest.type === "action") {
    const labels = {
      challenge: "Challenge the hypothesis",
      acquire: "Acquire missing evidence",
      escalate: "Escalate cognition",
      deescalate: "Reduce model capacity",
    } as const;
    return { label: labels[latest.action] ?? "Regulatory intervention", detail: latest.title };
  }
  if (latest.type === "halt") {
    return { label: "Stop, do not guess", detail: "The available evidence cannot discriminate." };
  }
  if (latest.type === "commit") {
    return { label: "Commit supported answer", detail: latest.label };
  }
  return { label: "Reading", detail: "A trace event has been recorded." };
}

export function BenchHero({ run, events, progress, complete, onRun }: BenchHeroProps) {
  const lastRead = [...events].reverse().find((event) => event.type === "read");
  const currentTier =
    lastRead && lastRead.type === "read" ? TIERS[lastRead.tier].short : "LIGHTNING";
  const currentCcg = lastRead && lastRead.type === "read" ? ccg(lastRead.ccg) : "—";
  const decision = currentDecision(events);
  const interventionCount = events.filter((event) => event.type === "action").length;
  const clampedProgress = Math.max(0, Math.min(100, progress * 100));
  const stage = complete
    ? "TRACE COMPLETE"
    : events.length
      ? "TRACE IN PROGRESS"
      : "AWAITING FIRST READ";

  return (
    <section className="bench-hero" aria-labelledby="bench-heading">
      <div className="bench-hero-atmosphere" aria-hidden="true">
        <div className="bench-hero-aura" />
        <div className="bench-hero-grain" />
      </div>
      <div className="bench-hero-inner">
        <div className="bench-hero-copy">
          <p className="bench-kicker">
            <span className="bench-signal-dot" />
            SECOND THOUGHT <span className="bench-kicker-slash">/</span> NMM REGULATORY RUNTIME
          </p>
          <h1 id="bench-heading">
            Reasoning is not
            <span className="bench-hero-serif">the verdict.</span>
          </h1>
          <p className="bench-hero-lead">
            The moment before a model commits is where intelligence needs a second thought.
          </p>
          <p className="bench-hero-body">
            Watch NMM observe the evidence, measure the Cognitive Calibration Gap, and let the
            Metacognitive Regulatory Layer decide whether to challenge, acquire, escalate, commit,
            or stop.
          </p>
          <div className="bench-hero-actions">
            <button type="button" className="bench-hero-primary" onClick={onRun}>
              <Play size={15} fill="currentColor" aria-hidden="true" />
              Run Berth 7
            </button>
            <a href="#bench-workbench" className="bench-hero-outline">
              Enter the runtime <ArrowDownRight size={18} aria-hidden="true" />
            </a>
          </div>
          <p className="bench-hero-disclosure">
            <span className="bench-disclosure-line" />A deterministic, closed-world replay. Provider
            connections are checked separately.
          </p>
        </div>

        <div className="bench-stage" aria-label="NMM regulatory state from the current trial">
          <div className="bench-stage-top">
            <span>
              COGNITIVE PASS <span className="bench-stage-index">/ 001</span>
            </span>
            <span className="bench-stage-state">
              <i aria-hidden="true" /> {stage}
            </span>
          </div>
          <div className="bench-stage-orbit">
            <div className="bench-stage-grid" aria-hidden="true" />
            <svg className="bench-stage-rings" viewBox="0 0 440 440" aria-hidden="true">
              <circle cx="220" cy="220" r="164" className="bench-ring-outer" />
              <circle cx="220" cy="220" r="135" className="bench-ring-inner" />
              <circle cx="220" cy="220" r="108" className="bench-ring-guide" />
              <circle
                cx="220"
                cy="220"
                r="135"
                className="bench-ring-progress"
                strokeDasharray={String((clampedProgress / 100) * 848.23) + " 848.23"}
                transform="rotate(-90 220 220)"
              />
              <path d="M220 38V80M220 360v42M38 220h42M360 220h42" className="bench-ring-ticks" />
              <path d="M151 151l138 138M289 151L151 289" className="bench-ring-diagonals" />
            </svg>
            <div className="bench-stage-core">
              <span>METACOGNITIVE</span>
              <strong>MRL</strong>
              <small>Regulatory layer</small>
            </div>
            <div className="bench-orbit-node bench-orbit-node-a" aria-hidden="true" />
            <div className="bench-orbit-node bench-orbit-node-b" aria-hidden="true" />
            <span className="bench-stage-coordinate bench-stage-coordinate-top">NMM // 01</span>
            <span className="bench-stage-coordinate bench-stage-coordinate-bottom">
              {run.trial.kicker}
            </span>
          </div>
          <div className="bench-stage-route" aria-label="Regulatory stages">
            <span>01 / OBSERVE</span>
            <i aria-hidden="true" />
            <span>02 / CALIBRATE</span>
            <i aria-hidden="true" />
            <span>03 / REGULATE</span>
          </div>
          <div className="bench-stage-measures">
            <div>
              <span>CURRENT MODEL</span>
              <strong>{currentTier}</strong>
            </div>
            <div>
              <span>CCG READING</span>
              <strong>{currentCcg}</strong>
            </div>
            <div>
              <span>INTERVENTIONS</span>
              <strong>{String(interventionCount).padStart(2, "0")}</strong>
            </div>
          </div>
          <div className="bench-stage-decision" aria-live="polite" aria-atomic="true">
            <div>
              <span>LATEST REGULATORY STATE</span>
              <strong>{decision.label}</strong>
              <p>{decision.detail}</p>
            </div>
            <ArrowUpRight size={20} aria-hidden="true" />
          </div>
          <div className="bench-stage-footer">
            <span>SECOND THOUGHT / {run.trial.id.toUpperCase()}</span>
            <span>{Math.round(clampedProgress)}% OF REPLAY</span>
          </div>
        </div>
      </div>
      <div className="bench-hero-bottom">
        <span>SOFTWARE SYSTEM FIRST. MODEL SECOND.</span>
        <Link to="/substrate">
          Explore the substrate <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
