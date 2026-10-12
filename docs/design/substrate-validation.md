# Substrate redesign validation

The redesign is implemented in the repository and validated locally. The supplied
Vercel URL redirects to Vercel sign-in. No live deployment was performed.

## Design and implementation

The original dope.security reference informs the dark hero, violet bloom, italic
display, frosted navigation, and translucent runtime pass. The subsequently uploaded
General Intelligence Company reference informs the parchment sections, Fraunces
editorial headings, and green-gray hairlines. The second reference was treated as
supporting material; the original redesign request was retained.

The page retains all three Nemotron tiers, published model values, nine controller
weights, and the existing Token Factory and Tavily probes. Fonts are self-hosted
with their licenses. Source/reference documents and runtime token mapping are
recorded in the project-root DESIGN.md.

## Results

- Production build and TypeScript check passed.
- Changed files passed Prettier and ESLint; the patch passed git diff --check.
- DESIGN.md lint passed with zero errors and zero warnings.
- The frontend skill's strict static project audit passed with zero findings.
- The project-owned browser runner passed **13 check groups**: desktop, tablet,
  390px and 320px layouts; local font loading; native disclosure and anchor keyboard
  behavior; actual missing-key server responses; pending/disabled states; duplicate
  prevention; stable controls; reduced motion; mocked success, transport failure,
  service failure, retry and empty results; truthful status failure and retry;
  keyboard scrolling of long responses; and navigation during a pending call.
- An axe-core 4.14.0 scan for WCAG 2 A/AA and WCAG 2.1 AA reported **zero violations**.
  This is an automated scan, not a claim of complete WCAG certification.
- The final production bundle passed at 1440px and 390px, including actual
  missing-key responses and a separate sibling-navigation smoke check.
- Browser checks reported no uncaught page errors.

## Existing repository failures

The script test suite executed 197 tests: **185 passed, 12 failed**, with no skips or
cancellations. The same 12 failures were present during onboarding: four require
absent Grok template documentation; eight assume generic title/placeholder-card
behavior that conflicts with the repository's Second Thought branding and custom
share card. The chained TypeScript suites were run separately: **59 passed**, with
no failures or skips.

Repository-wide lint reports three pre-existing no-empty errors in live-core.mjs
and src/lib/app-data/client.server.ts, plus one unused-variable warning in
live-replay.mjs. Those files are unchanged. The redesign files pass lint.

## Local startup fixes

The environment wrapper launches Vite's installed JavaScript CLI with Node,
preserving app flags and literal arguments without relying on Windows' vite.cmd
shim. All 25 wrapper and auth checks passed, including execution without a PATH
shim and from a directory containing spaces. The real Vite CLI and build:dev
also passed in the cloud environment; native Windows execution was not available.

The prebuilt server now listens on port 8080 to match SecondThought.ps1. Its home
and Substrate routes returned HTTP 200 on that port, and the cloud dev preview was
restored after verification.

## Limits and reproduction

Live provider success was tested with intercepted responses. No live model/search
credentials were configured or used. The real missing-key paths were exercised
against both dev and production bundles.

The inherited Google Fonts stylesheet and Grok extension script did not load during
browser checks: policy denials were observed, and the later onboarding smoke also
reported a certificate trust failure for the extension. TLS verification remains
enabled. The redesigned page's four local fonts were verified loaded, so its
typography does not depend on the external stylesheet.

From the repository, with the dev server running, use:

    node scripts/substrate-browser-check.mjs

The runner uses Playwright and selects the installed system Chromium when a bundled
browser is unavailable. Set SUBSTRATE_AXE_PATH to a trusted local axe.min.js file to
include the accessibility scan, and SUBSTRATE_BROWSER_EXECUTABLE to select another
installed browser. The runner restricts its target to a local server.

Current-run screenshots, browser results, and accessibility evidence are retained
in ignored artifacts/substrate-design. Build, unit-test, and lint logs are in
/workspace/.design-work.
