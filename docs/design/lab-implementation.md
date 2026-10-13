# Evaluation Lab visual redesign

## Approved design alignment

The Evaluation Lab at \`/lab\` now uses the cinematic Second Thought editorial system established for the Bench route: midnight black, focused violet, self-hosted Substrate typography, purposeful open space, detailed comparison surfaces, and responsive controls. The shared shell provides the same navigation as Bench and Substrate, but routes retain separate content.

## Evaluation data

\`runBattery()\` and \`summarize()\` are unchanged. The Lab still presents 64 seeded deterministic trials, four failure conditions, a fixed unregulated Ultra baseline, NMM allocation, and the original accuracy, false certainty, calibration, token, latency, and cost calculations.

The evidence boundary is explicit. These are controlled simulation results and modeled pricing, not observed live Nemotron responses or Nebius billing data. API credentials being configured do not imply a live evaluation.

## Visual implementation

- \`src/components/lab-view.tsx\` contains the editorial experiment hero, three primary statistics, accessible baseline-versus-regulated comparison bars, the full metric table, failure-condition breakdown, tier allocation, and methodology.
- \`src/lab.css\` contains route-scoped Lab styles and responsive rules, including a 390px mobile layout.
- \`src/components/shell.tsx\`, \`src/routes/lab.tsx\`, and \`src/styles.css\` connect the Lab to the shared navigation and styles.
- \`scripts/lab-browser-check.mjs\` verifies hero, 64 trials, ten comparison rows, stable non-zero chart bars, navigation, mobile overflow, and uncaught errors.

The bar display does not require client-side chart-library measurement or entrance animation. All values come from the existing summarized battery.

## Preservation

No NMM trial definitions, engine logic, model decisions, backend API behavior, or credentials were changed. Bench remains a separate interactive trace demonstration; Substrate retains its own design.
