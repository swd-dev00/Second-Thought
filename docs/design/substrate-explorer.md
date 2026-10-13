# Interactive Substrate architecture card

The original static Cognitive Runtime card is now an architecture explorer. Users can select **Evidence**, **Calibration**, **Allocation**, and **Judgment**. The visible panel explains the selected stage in plain language and links directly to a corresponding canonical replay in Bench.

The links use the existing trial IDs: `berth-7`, `yield-440`, and `door-2`. The card does not synthesize model output, query providers, or suggest that selecting a tab executes the controller.

The provider area reports **credential configuration**, not verified live API connectivity. Its **Test providers** link opens the existing connections area, which hosts the separate Nebius Token Factory and Tavily probes. The decorative barcode has been removed.

Validation: `node scripts/substrate-runtime-explorer-check.mjs` verified all selectable states, example destinations, connection navigation, mobile width, and the absence of uncaught browser exceptions (5 passing checks). TypeScript and targeted ESLint passed. The Bench replay regression also passed 10 checks.

Scope: `src/components/substrate-view.tsx` and `src/substrate.css`, plus browser checks. No modifications to the NMM controller, model allocation, or evidence corpus.
