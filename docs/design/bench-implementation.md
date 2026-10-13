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
