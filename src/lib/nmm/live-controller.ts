import { BERTH } from "./trials";
import {
  cognitiveCalibrationGap,
  computeSignals,
  rankPair,
  regulatedScores,
  softmax,
} from "./signals";
import type { Evidence } from "./types";

export type Choice = "labor" | "crane" | "exam" | "abstain" | "unreadable";
export type PublicModelRead = {
  choice: Choice;
  summary: string;
  evidenceIds: string[];
  model: string;
  latencyMs: number;
  usage: { input: number; output: number } | null;
};

const initial = BERTH.evidence.filter((item) => item.availability === "initial");
const missing = BERTH.evidence.filter((item) => item.availability === "retrievable");

/** Reproducible signals from scenario evidence, not private model reasoning. */
export function inspectInitialEvidence() {
  const posterior = softmax(regulatedScores(BERTH, initial, false, "lightning"), 0.34);
  const signals = computeSignals({
    trial: BERTH,
    packet: initial,
    allVisible: initial,
    posterior,
    framingCleared: false,
    prevPosterior: null,
  });
  const stale = initial.filter((item) => item.ageDays > 20 && item.salience >= 0.8);
  return {
    ccg: Math.round(cognitiveCalibrationGap(signals) * 1000) / 1000,
    signals: {
      contradiction: Math.round(signals.contradiction * 1000) / 1000,
      competition: Math.round(signals.competition * 1000) / 1000,
      assumptions: Math.round(signals.assumptions * 1000) / 1000,
      verificationFail: Math.round(signals.verificationFail * 1000) / 1000,
    },
    leadingEvidenceHypothesis: rankPair(posterior).leader,
    staleAnchor: stale[0]?.id ?? null,
    acquiredEvidence: missing.map((item) => ({
      id: item.id,
      source: item.source,
      text: item.text,
    })),
    decision: "BLOCK INITIAL COMMIT / CHALLENGE STALE ASSUMPTION / ACQUIRE MISSING EVIDENCE",
    why: "The initial packet contains a stale labor warning, contradictory current gate activity, and no observation joining a commodity to this berth.",
  };
}

/**
 * Fail-closed scenario gate. Does not look at BERTH.truth.
 * A new model answer is not enough: both independent synthetic observations
 * must be cited for the joint inference to support a commitment.
 */
export function adjudicateLive(read: Pick<PublicModelRead, "choice" | "evidenceIds">) {
  const known = new Set(BERTH.evidence.map((item) => item.id));
  const validSources = read.evidenceIds.filter((id) => known.has(id));
  const synthesis = BERTH.synthesis!;
  const hasJointEvidence = synthesis.ids.every((id) => validSources.includes(id));
  if (read.choice === synthesis.favors && hasJointEvidence) {
    return {
      state: "committed" as const,
      answer:
        BERTH.hypotheses.find((hypothesis) => hypothesis.id === read.choice)?.label ?? read.choice,
      explanation:
        "Both scenario observations are cited together. The controller allows a supported commitment.",
      evidenceIds: validSources,
    };
  }
  return {
    state: "withheld" as const,
    answer: "No supported commitment",
    explanation:
      read.choice === "unreadable"
        ? "The model did not return a usable structured answer. The controller withheld commitment."
        : "The revised answer did not supply the required paired observations for a defensible commitment.",
    evidenceIds: validSources,
  };
}

export function scenarioPacket(phase: "first" | "revised"): Evidence[] {
  return phase === "first" ? initial : [...initial, ...missing];
}
