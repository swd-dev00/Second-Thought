# See it reason: Bench visual redesign

## Scope

This redesign applies to the root Bench route, opened by the **See it reason** link on Substrate. It uses the supplied dope.security style reference rather than the Scale AI screenshot. Substrate and Evaluation Lab retain their own route content and functionality.

## Visual direction

Near-black `#090909` anchors the experience. Signal violet `#af50ff` is concentrated in the regulatory visualization, primary action, and active state. The existing self-hosted Substrate Inter, Lora Italic, and IBM Plex Mono fonts provide light editorial display typography, an expressive italic, and technical annotations. The design uses thin rules, translucent passes, intentional whitespace, and restrained motion with a reduced-motion fallback.

## Preserved functionality

The original engine, evidence records, closed-world trials, playhead, speed controls, step navigation, baseline comparison, intervention rail, CCG instrument, and outcome/verdict views remain in `src/components/bench.tsx`. The hero is a visualization of the same `runTrial` output and currently visible replay events, not a second engine.

The three canonical cases remain **Berth 7**, **Run 440**, and **Door 2**. The interface labels the replay as deterministic and closed-world; the separate runtime strip reports the presence of configured Nebius Token Factory and Tavily credentials, not successful provider inference.

## Files

- `src/components/bench-hero.tsx`: NMM regulatory pass visualization and hero action
- `src/bench.css`: scoped hero, trial selection, replay, typography, and responsive styles
- `src/components/bench.tsx`: attaches actual replay state to the new hero and reorganizes the trial interface
- `src/components/shell.tsx`: shares the Substrate navigation system with Bench but preserves its own destination
- `src/routes/index.tsx` and `src/styles.css`: Bench route selection and stylesheet import
- `scripts/bench-visual-check.mjs`: focused browser regression checks

## Validation boundaries

Validation on Windows: TypeScript passed, targeted ESLint passed, and `scripts/bench-visual-check.mjs` passed all eight browser checks. The browser checks cover the desktop experience, live controller visualization, playback stepping, trial selection, Substrate and Evaluation Lab isolation, 390px mobile overflow, and uncaught browser errors.

No live Token Factory or Tavily call is part of the visual checks. Existing baseline simulation results are not represented as independently verified live model behavior.

## Evidence clarity adjustment

The Bench now waits for an explicit user action before progressing, including when reduced motion is requested. Final tier selection uses the last tier-bearing event rather than the last calibration read; the CCG remains the last read's value. API status reports key configuration only, not authenticated connectivity. Acquisition details and modeled cost, token and latency figures are explicitly identified as deterministic replay artifacts rather than live provider measurements. No change was made to the canonical trial engine or ground truth.

## Case card and visible execution state

The hero now explains each selectable trial in plain language. The primary Run action and its feedback occupy one case card, including a visible progress bar, numeric percent, NMM intervention status, and pause or resume controls. Starting a replay brings the nearby progress indicator into view rather than jumping to the deeper workbench. The trace engine remains unchanged.
