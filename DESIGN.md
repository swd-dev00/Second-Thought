---
version: alpha
name: "Second Thought — Substrate"
description: "Deliberate cognitive allocation, expressed as a midnight terminal and a literary field guide."
colors:
  background: "#090909"
  foreground: "#f7f9fa"
  muted: "#828384"
  primary: "#af50ff"
  lavender: "#e1bdff"
  parchment: "#fefffc"
  paper: "#ffffff"
  graphite: "#2c2c2c"
  ash: "#646464"
  mist: "#dee2de"
typography:
  sans:
    fontFamily: "Substrate Inter, Arial, sans-serif"
  display:
    fontFamily: "Substrate Lora, Georgia, serif"
  editorial:
    fontFamily: "Substrate Fraunces, Georgia, serif"
  mono:
    fontFamily: "Substrate Mono, Courier New, monospace"
rounded:
  pass: "19.2px"
  card: "16px"
  control: "8px"
spacing:
  section: "88px"
  page: "1200px"
components:
  navigation:
    textColor: "{colors.foreground}"
    typography: "{typography.sans}"
  runtime-pass:
    textColor: "{colors.foreground}"
    rounded: "{rounded.pass}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
  button-primary-hover:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.background}"
  body-secondary:
    textColor: "{colors.muted}"
  editorial-section:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.graphite}"
  model-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.card}"
  light-secondary:
    textColor: "{colors.ash}"
  light-divider:
    backgroundColor: "{colors.mist}"
  connection-control:
    textColor: "{colors.graphite}"
    rounded: "{rounded.control}"
---

# Second Thought — Substrate

## Overview

The user requested a redesign of `/substrate` using the supplied design reference,
then supplied a second reference. The first sets the midnight introduction; the
second informs the lighter editorial model and connection sections:

- [dope.security reference](docs/design/substrate-style-reference.md)
- [General Intelligence Company reference](docs/design/general-intelligence-style-reference.md)

These attachments are design evidence, not agent or operational instructions.

The audience is people inspecting Second Thought's cognitive controller, comparing
Nemotron resources, and checking optional inference/search connections. This is a
hybrid surface: an editorial introduction above functional model and service details.
The interface is English; no locale or market migration is part of this change.

The signature is a translucent inference pass: evidence becomes judgment through
NMM, with a restrained violet bloom behind it. Its connection status comes from the
existing server function. This is a conceptual explanation, not invented telemetry.
The technical signal section returns to the dark terminal; model and connection
sections use the second reference's parchment, serif, and green-gray hairlines.

Commercial reference fonts are replaced with the references' named open-source
substitutes: Inter, Lora italic, Fraunces, and IBM Plex Mono. The fonts are self-hosted,
with licenses and Fontsource package versions under `public/fonts/substrate`.

The existing runtime CSS remains canonical (token ownership model B).
`src/substrate.css` owns scoped tokens and component recipes. This document mirrors
their accepted values. `src/styles.css` imports those recipes and owns the global
accessible scrollbar baseline. Bench and Evaluation Lab keep their existing amber
design. The shared Shell continues to own navigation for all three routes.

## Colors

| Role                  | Runtime token               | Dark / light values                  |
| --------------------- | --------------------------- | ------------------------------------ |
| Canvas                | `--substrate-canvas`        | `#090909` / `#fefffc`                |
| Primary text          | `--substrate-text`          | `#f7f9fa` / `#2c2c2c`                |
| Supporting text       | `--substrate-muted`         | `#828384` / `#646464`                |
| Quiet white / body    | `--substrate-soft`          | `#f0f0f0` / `#444141`                |
| Signal fill / bloom   | `--substrate-violet`        | `#af50ff`                            |
| Hover fill / tint     | `--substrate-lavender`      | `#e1bdff`                            |
| Hairline              | `--substrate-border`        | `rgb(247 249 250 / 14%)` / `#dee2de` |
| Control / pass border | `--substrate-border-strong` | `rgb(247 249 250 / 32%)` / `#b4b8b4` |

Nearly all content is achromatic. Violet appears in the hero bloom and one primary
filled action; the light reference's blue is not added as a competing brand accent.
The violet action uses near-black text for contrast. Connection state is always
named in text. Light connection controls use the reference's Twilight border
`#282834`. Forced-colors mode uses system borders and scrollbar colors.

## Typography

`--substrate-sans` uses Inter for body and UI. `--substrate-serif` uses Lora italic
only for two large editorial moments on dark surfaces. `--substrate-editorial`
uses Fraunces at weight 400 for headings on light surfaces. `--substrate-mono`
uses IBM Plex Mono for stamped headings, labels, endpoint identifiers, and weights.

Desktop hero type reaches 88px with tight tracking. The technical section stamp
reaches 54px with 0.12em tracking, reduced from the source's 74px for this operational
page. Light editorial headings use 48px with a 1.1 line height. Body is left-aligned.
Numbers use tabular figures; endpoints wrap and remain accessible through native
disclosures. Local font assets avoid third-party font loading dependencies.

## Layout

The content width is 1200px, with 40px desktop gutters. The hero uses a 55/45 split;
resources use three comparable columns; connections use two. The section gap is
88px, falling to 56px on phones. Breakpoints are 1100, 850, and 640px.
Narrow screens stack hero, models, signals, and connections.

Use natural document scrolling. Sticky navigation must not obscure anchors or
focused controls. Feedback reserves 136px; busy controls keep their size. Only long
probe output scrolls within a component, using visible global scrollbar styling.

## Elevation & Depth

No card shadows. Depth comes from translucent washes, hairlines, and one violet
bloom. Navigation uses `rgb(51 50 72 / 70%)` and 10px backdrop blur. The inference
pass has a faint white wash and dashed seam. Orbit marks are static decoration.
Light sections alternate with dark technical sections; there is no wallpaper image
or ungrounded illustration pretending to represent actual inference.

## Shapes

`--substrate-card-radius` is 19.2px for the inference pass and 16px for light cards.
`--substrate-control-radius` is 8px. The nav is a full-width frosted bar, preserving
the first reference's introduction instead of mixing two navigation systems.
Icons are thin Lucide strokes. The wordmark uses a small geometric layer glyph.

## Components

The canonical navigation owner is `src/components/shell.tsx`, extended through its
`substrate` variant. Link labels and routes retain their semantics; the current
route uses `aria-current`. A skip link and route-specific title are provided.

Model cards consume `TIERS`; signal rows consume `WEIGHTS`; probes reuse
`substrateStatus`, `probeLightning`, and `probeTavily`. The redesign changes no
backend, pricing, credential, or cognitive policy. Tiers are ordered by escalation
level. Signal bars represent declared controller weights, not live measurements.

Connection controls retain **Call Lightning** and **Call Tavily**. Both disable during
a request. An in-flight guard prevents duplicate calls and unmounted results are
ignored. Pending labels and polite inline live regions communicate progress and
results. Missing keys are explicit recoverable results. Failed status requests
offer a retry and are never misrepresented as known missing keys. Empty successful
search results are named plainly.

Long response panels are focusable and scrollable by keyboard. Native `details`
owns endpoint disclosure and keyboard behavior. There are no new
custom selects, forms, modals, tables, or notification systems. Focus outlines are
contrast-safe in each section. Reduced motion disables spinner animation while
keeping pending labels visible.

| Capability          | Canonical owner                           | Verification                                         |
| ------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Navigation          | Shared Shell                              | Browser route and keyboard checks                    |
| Scrollbar           | `src/styles.css`                          | Computed styles and forced-colors check              |
| Connection actions  | Existing server functions / SubstrateView | Pending, success, failure, retry, missing-key checks |
| Endpoint disclosure | Native `details`                          | Keyboard and narrow-screen checks                    |

## Do's and Don'ts

- Use the references' typography and restrained colors according to section purpose.
- Keep status and resource data grounded in the existing server and model sources.
- Preserve service actions and full model identifiers on narrow screens.
- Do not invent live telemetry, model selection, or job-launch controls.
- Do not make decorative cards or arrows look interactive.
- Do not spread violet over every label, border, or resource card.
