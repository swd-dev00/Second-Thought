# Walkthrough flash investigation

The reported one-second black flash at 00:05 occurred in the local Windows
development server at http://localhost:8080. The action immediately before it was
not recorded. Its cause remains unconfirmed; this pass does not mark it fixed.

The available remote build was checked in Chromium at 1440 × 950 with normal and
reduced motion. The check sampled visible page content every 100 milliseconds,
saved startup screenshots at one-second intervals, started the Berth 7 replay,
and navigated Bench → Evaluation Lab → Substrate → Bench. After the first visible
render, all 330 content samples retained a visible heading and nonempty main
content. There were no uncaught page errors or hot updates. The screenshots also
showed content. The flash did not reproduce under these conditions.

DOM sampling and intermittent screenshots do not exclude a compositor, browser,
recording, or navigation-specific flash. The unpushed Windows audit changes and
their exact browser conditions were not available during this check.

A later Windows transcript records Vite optimizing lucide-react and then
reporting "optimized dependencies changed. reloading". It also records server
restarts after edits to .env.local. These are confirmed development reloads and
plausible flash triggers, but the transcript has not been aligned with 00:05 in
the video. Do not assign the observed black frame to either event yet.

## Run the check on Windows

Keep the intended development server running in one PowerShell window. In a
second window, run from the project folder:

```powershell
node scripts/flash-browser-check.mjs
```

On Windows the script uses installed Microsoft Edge. To select a different
installed browser, set FLASH_BROWSER_EXECUTABLE to its executable path. It makes
no model or search provider requests. It checks only a local server, records
screenshots and diagnostics in ignored artifacts/flash-investigation, and fails
the run if hot updates make the startup sequence unstable. Avoid source edits
during the check. TLS verification stays enabled.

If the video is available, recover the exact preceding action at 00:04–00:06 and
repeat that action in the same browser, viewport, and build. Record the commit,
uncommitted changes, browser version, action, and whether the flash repeats before
assigning a cause. A clean recording take alone is not evidence that an application
defect was fixed.
