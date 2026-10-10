import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { runBattery } from "@/lib/nmm/battery";
import { money, pct, seconds, tokens } from "@/lib/nmm/format";
import { summarize } from "@/lib/nmm/metrics";
import { TIERS } from "@/lib/nmm/models";

const CONDITION_LABEL: Record<string, string> = {
  easy: "Low complexity",
  stale: "Stale salient anchor",
  external: "Needs external evidence",
  underdetermined: "Nothing can discriminate",
};

export function LabView() {
  const report = useMemo(() => summarize(runBattery()), []);
  const chart = [
    { name: "Accuracy", baseline: Math.round(report.baseline.accuracy * 100), regulated: Math.round(report.regulated.accuracy * 100) },
    { name: "False certainty", baseline: Math.round(report.baseline.falseCertainty * 100), regulated: Math.round(report.regulated.falseCertainty * 100) },
    { name: "Calibration error", baseline: Math.round(report.baseline.ece * 100), regulated: Math.round(report.regulated.ece * 100) },
  ];
  const rows = [
    ["Task accuracy", pct(report.baseline.accuracy), pct(report.regulated.accuracy)],
    ["False certainty", pct(report.baseline.falseCertainty), pct(report.regulated.falseCertainty)],
    ["Calibration error", report.baseline.ece.toFixed(2), report.regulated.ece.toFixed(2)],
    ["Evidence acquisition", String(report.baseline.acquisitions), String(report.regulated.acquisitions)],
    ["Escalated off Lightning", String(report.baseline.escalations), String(report.regulated.escalations)],
    ["De-escalated to Lightning", String(report.baseline.deescalations), String(report.regulated.deescalations)],
    ["Abstained", String(report.baseline.abstentions), String(report.regulated.abstentions)],
    ["Mean tokens", tokens(report.baseline.meanTokens), tokens(report.regulated.meanTokens)],
    ["Mean latency", seconds(report.baseline.meanLatency), seconds(report.regulated.meanLatency)],
    ["Mean cost", money(report.baseline.meanCost), money(report.regulated.meanCost)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <p className="text-xs tracking-widest text-amber uppercase">Evaluation lab</p>
        <h1 className="mt-2 font-display text-3xl text-fg sm:text-4xl">
          Model size is not a cognitive policy. This battery measures the difference.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {report.n} controlled trials. Four failure conditions, sixteen each, seeded so the run does not drift.
          Baseline is unregulated {TIERS.ultra.short} on every trial. Second Thought starts on {TIERS.lightning.short} and spends a larger tier only when the calibration gap says to.
          Prices are Token Factory list rates. This is the workload a Nebius Serverless Job executes. Here it runs in the session so every condition is inspectable.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Callout label="Intervention success" value={pct(report.interventionSuccess)} detail="Share of baseline failures that regulation corrected, including warranted abstentions." />
        <Callout label="Mean cost" value={pct(1 - report.costRatio)} detail="Reduction versus unregulated Ultra, on the same trials." />
        <Callout label="Mean tokens" value={pct(1 - report.tokenRatio)} detail="Less cognition, not a smaller model pretending to be careful." />
      </section>

      <section className="border border-line bg-panel p-4">
        <h2 className="font-display text-2xl text-fg">Where the arms diverge</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} barGap={4}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
              <YAxis stroke="var(--color-muted)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} unit="%" width={40} />
              <Tooltip
                cursor={{ fill: "var(--color-panel-2)" }}
                contentStyle={{ background: "var(--color-ink)", border: "1px solid var(--color-line)", color: "var(--color-fg)" }}
              />
              <Bar dataKey="baseline" name="Baseline Ultra" fill="var(--color-muted)" />
              <Bar dataKey="regulated" name="Second Thought" fill="var(--color-amber)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-x-auto border border-line">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-panel text-xs tracking-widest text-muted uppercase">
            <tr>
              <th className="px-3 py-3 font-medium">Metric</th>
              <th className="px-3 py-3 font-medium">Baseline Ultra</th>
              <th className="px-3 py-3 font-medium text-amber">Second Thought</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t border-line">
                <th className="px-3 py-3 font-medium text-fg">{row[0]}</th>
                <td className="px-3 py-3 tabular-nums text-muted">{row[1]}</td>
                <td className="px-3 py-3 tabular-nums text-fg">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="border border-line bg-panel p-4">
          <h2 className="font-display text-2xl text-fg">By failure condition</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {report.byCondition.map((row) => (
              <li key={row.condition} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3 border-b border-line pb-3">
                <span className="text-sm text-fg">{CONDITION_LABEL[row.condition]}</span>
                <span className="text-xs text-muted tabular-nums">Ultra {row.baseline}/{row.n}</span>
                <span className="text-xs text-amber tabular-nums">NMM {row.regulated}/{row.n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-line bg-panel p-4">
          <h2 className="font-display text-2xl text-fg">Highest tier used</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {(Object.keys(report.highestTier) as (keyof typeof report.highestTier)[]).map((tier) => (
              <li key={tier} className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-fg">{TIERS[tier].short}</span>
                <span className="text-sm tabular-nums text-amber">{report.highestTier[tier]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Highest tier touched, including a later de-escalation. Lightning carrying an easy trial is the result, not a fallback.
          </p>
        </div>
      </section>

      <p className="max-w-3xl text-xs leading-relaxed text-muted">
        The reasoner in this lab is a closed-world model of observable failure: salience anchoring, stale framing, missing evidence, and symmetric hypotheses.
        It is not a claim that these rates transfer to open-web tasks. It is the measurement scaffold. Live Nemotron traces replace the model of the model when Token Factory credentials are present. The regulatory layer — what it measures, and when it refuses to answer — stays the same.
      </p>
    </div>
  );
}

function Callout({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="border border-line bg-panel p-4">
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-4xl text-amber tabular-nums">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p>
    </article>
  );
}
