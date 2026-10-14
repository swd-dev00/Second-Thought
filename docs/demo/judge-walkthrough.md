# Second Thought: 170-second judge walkthrough

This is the narration plan for a recording path. A silent cloud-browser rehearsal measured **170.002 seconds**; a narrated final submission has not been recorded. Target the final frame at **2:50 (170 seconds)**. That leaves ten seconds beneath the 180-second limit for small delivery or navigation delays. Finish the closing line by 2:55 at the latest; do not use that margin to add content.

The path demonstrates one mechanism: **first read → evidence problem → regulatory action → final judgment**. It uses Berth 7 once, a short Evaluation Lab view, and separate provider connection checks. It does not tour the recorder, dual reasoning panes, CCG instrument, intervention rail, or full model catalog.

## Build and recording preflight

- Record the branch, commit, any uncommitted changes, and application URL used for the take. Audit commit `e359e8e` has now been imported: the source contains Decision Shift, the bounded Lightning success receipt, and “Closed-world intervention success.” Verify these appear in the actual running build used for recording.
- Verify that the case card shows all four source labels: **First read**, **What NMM noticed**, **What changed**, and **Final judgment**. Before playback it should show **WAITING**, “No hypothesis formed yet,” and “Not committed.” During playback the read and intervention fields should update; completion should show the final answer. Verify that successful provider checks show bounded receipts and Tavily does not display result titles or URLs.
- LiveWitness and its dependencies are included in `b386656`; Vercel reports a successful preview for that commit. Confirm the intended running build before recording. This script uses provider connection receipts and does not run the separate **Try real NVIDIA inference** challenge, which can make two longer provider requests.
- Start the application and keep its server terminal running. Configure credentials on the server, never on camera. Key presence alone does not prove an authenticated provider request.
- Prepare three tabs on the same running build: `/` with Berth 7 selected and not started; `/lab`, positioned so the three summary metrics and their qualification are visible; and `/substrate#connections`, showing both connection cards. Keep the Bench tab on its case card, with Decision Shift and replay progress visible. Preloading removes loading and catalog scrolling from the recorded path.
- Confirm playback speed is **1×**. The source schedules a nominal 15-second replay. One integrated Chromium check measured 15.148 seconds from the click to the completed Decision Shift; this is not a Windows or finished-video measurement. A background tab or slow device can alter visible timing. Keep the Bench tab foregrounded during playback.
- Follow [the flash reproduction notes](flash-investigation.md) with the intended browser, viewport, build, and navigation sequence before recording. The current integrated-build Chromium check did not reproduce an empty page in 332 content samples across both motion settings. That does not clear the original Windows compositor or recording issue. Record the result for the intended recording environment. A warmed recording route is useful for staging; it does not establish that a cold-load defect is fixed.
- Start a visible off-camera stopwatch with the recording. Speak at a practiced, comfortable pace. Run the complete path once and record its actual duration below before the final take.

## Run of show

The timestamps are deadlines from the recording's start. Narration overlaps the replay and provider waits. Do not add waits after the scripted explanation.

| Time          | Screen and action                                                                                                             | Narration                                                                                                                                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0:00–0:15** | Bench first screen. Keep the case card visible.                                                                               | “Second Thought changes the reasoning strategy before an unsupported answer becomes the verdict. NMM examines the evidence and decides whether to challenge, retrieve, increase model capacity, commit, or stop.”                                                                                                         |
| **0:15–0:30** | Point to Berth 7 and the unstarted Decision Shift.                                                                            | “Cargo dwell time increased forty-one percent. Labor trouble is the plausible starting explanation. Before the run, Decision Shift says no hypothesis is formed and no judgment is committed. Watch that change.”                                                                                                         |
| **0:30–0:50** | Click **Run this case** once at 0:30. Stay on Decision Shift through the nominal 15-second replay.                            | “The labor explanation conflicts with gate activity, and its bulletin is stale. NMM challenges the assumption, brings in missing observations, and changes cognitive allocation when the remaining evidence requires it.”                                                                                                 |
| **0:50–1:10** | Hold the completed Decision Shift. Point to First read, What changed, and Final judgment; the latest action is de-escalation. | “The final judgment is a targeted exam on HS 8507. The external notes settle the cause when combined. After deeper analysis, NMM returns to Lightning to state the answer. Evidence and allocation changed before commitment.”                                                                                            |
| **1:10–1:25** | Stay on the same completed card. Do not select another case or scroll into the workbench.                                     | “The other controlled cases test the same policy: stop when evidence cannot separate two causes, and stay on Lightning when the packet is sufficient. This replay is deterministic; it does not call live providers.”                                                                                                     |
| **1:25–1:50** | Switch to the prepared Lab tab. Show the three qualified summary metrics. Do not tour the full table.                         | “The Lab compares sixty-four seeded trials against a fixed unregulated Ultra baseline. Closed-world intervention success includes warranted abstention. These results demonstrate behavior in this harness. Cost and token reductions are modeled estimates, not observed provider billing or a general model benchmark.” |
| **1:50–2:30** | Switch to the prepared connection tab. Follow the time-bounded procedure below. Do not visit the model-family section.        | “These are separate live checks. Token Factory checks that Lightning can respond; Tavily checks search access. A successful receipt confirms this connection worked now. It does not turn the Bench replay or Lab percentages into a live-model evaluation.”                                                              |
| **2:30–2:50** | Return to the completed Bench tab. Hold Decision Shift for the final frame.                                                   | “The visible result is the decision shift: first read, evidence problem, changed behavior, supported judgment. Second Thought makes committing, escalating, and stopping decisions that must answer to the evidence.”                                                                                                     |

## Forty-second connection window

Use one attempt per provider. Both buttons are disabled during an in-flight check, so a slow first request can prevent a second attempt. A presentation deadline does not cancel the server request; the inspected probe source has a 20-second network timeout.

1. **1:50–1:55:** Switch to the prepared connection view and begin the explanation.
2. **At 1:55:** Click **Call Lightning**. Show the bounded receipt if it arrives. At **2:10**, stop waiting for presentation purposes.
3. **At or before 2:10:** If the controls are available, click **Call Tavily**. Show its bounded receipt if it arrives. If Lightning remains pending, do not click repeatedly and do not claim Tavily was checked.
4. **At 2:25:** End provider inspection, whether the result is success, failure, missing credentials, or pending. Use the matching line below, then return to Bench by **2:30**. Do not retry during the take.

Choose the line that matches what is actually visible:

- **Both successful:** “Both live connections responded. These are connection receipts, separate from the controlled evaluation.”
- **One successful, one failed or unavailable:** “Lightning [or Tavily] responded. The other connection is unavailable in this take; the controlled replay remains independently reproducible.”
- **Still pending:** “This live check is still pending, so I will not claim a connection result. The replay and Lab remain the controlled evidence shown today.”
- **Credentials missing or both failed:** “Live connectivity is not demonstrated in this take. The mechanism and Lab results shown here come from the disclosed closed-world harness.”

If an error or raw response unexpectedly appears, use the truthful fallback line and leave that tab. Do not read diagnostic details, keys, raw model text, or search snippets aloud. Correct the receipt handling before the next take.

## Timing discipline and acceptance

The eight slots total **170 seconds**, including a 40-second provider window. Narration plays during the 15-second replay and up to 30 seconds of provider waiting; those waits are already in the budget. Provider failure changes the words, not the length of the path.

- If the replay has not completed by 0:50, use the next twenty-second explanation slot to let it finish and point to actual visible events. Do not state an unseen final result. If it still has not finished by 1:10, call the replay incomplete, move to the Lab on schedule, and investigate that run before recording again.
- If behind at 1:10, omit the next “other controlled cases” explanation and reach the Lab by 1:25. If behind at 1:50, omit the second provider attempt. Preserve the proof qualification and closing mechanism.
- If behind at 2:30, use this eight-second ending: “First read. Evidence problem. Behavior changes. Final judgment. That is the Second Thought decision shift.” Finish by 2:55.
- Accept a final take only when its measured duration is under 180 seconds, the mechanism is visible during the first minute, and every claim matches the displayed build and results. A provider failure can be shown truthfully; it cannot be relabeled as successful connectivity. Do not crop the proof caveat out of the Lab frame.

| Rehearsal evidence                | Recorded value, 2026-10-13 (America/New_York)                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Branch / commit / build changes   | `secondthought/demo-finish` / `477a5c6`; application source unchanged; new recording helpers and documentation uncommitted during capture |
| Browser / viewport / URL          | Cloud Chromium 154.0.8037.57 / 1440 × 1000 / local port 8080                                                                              |
| Blank flash reproduction          | Startup/navigation diagnostic: 332 samples without empty content; original Windows flash remains unconfirmed                              |
| Actual replay elapsed time        | 15.454 seconds; completed judgment visible at take time 45.469 seconds                                                                    |
| Lab / connection / closing frames | 88.716 / 110.678 / 150.311 seconds                                                                                                        |
| Lightning / Tavily outcome        | Both returned their actual missing-key responses; no provider request or successful connectivity claimed                                  |
| Complete browser path duration    | **170.002 seconds**, measured with a monotonic clock                                                                                      |
| Reload / error checks             | Three initial document loads, one per prepared tab; no further loads, hot updates, or page errors                                         |
| Video artifact                    | Silent browser rehearsal, **170.080-second MP4**, assembled at the actual tab switches; narrated final submission not produced            |

## Reproduce the measured browser rehearsal

Keep the server running and avoid file edits during recording. The recorder uses three prepared tabs and a single Berth replay. It retains the completed Bench tab for the closing frame instead of navigating away and remounting it. It captures real application pages and server responses, without mocked provider success.

```powershell
npx playwright install ffmpeg
node scripts/judge-rehearsal.mjs
node scripts/judge-rehearsal-video.mjs
```

The final command requires `ffmpeg` and `ffprobe` on PATH. On Windows, the recorder uses installed Edge; `JUDGE_BROWSER_EXECUTABLE` can select another browser. The cloud run used its local Playwright binary cache with system Chromium. These optional recording dependencies do not change the application or package lockfile.

By default, only checks with missing credentials are exercised. To deliberately make configured provider requests, append `--live-probes` to the recorder command. It records actual failures or pending states and never substitutes a success receipt. Configure keys securely on the server before a live take.

Generated output is ignored under `artifacts/judge-rehearsal`: `timing.json`, stage screenshots, three raw tab videos, assembled `judge-rehearsal.mp4`, and `video-check.json`. Assembly removes preflight and inactive-tab footage using the actual checkpoint times; it does not accelerate playback or replace application content. The stream offsets use page-creation timing and can differ from UI checkpoints by a few video frames. Use the original screen recording for a submission that requires an unedited take.

The assembled MP4 measured **170.080 seconds** and contained **zero** sustained-black intervals under the rendered-frame check. The check flags intervals of at least 0.08 seconds with at least 99% near-black pixels. A negative result is a rendered-frame check for this rehearsal, not a diagnosis of the original Windows flash. The actual narrated final take must still be measured under 180 seconds.

An earlier full rehearsal failed its closing check because Bench showed 0% after returning to its tab. A short tab-switch check retained 100%, and the complete retry without file edits retained 100% with no reloads. The initial reset's cause was not established; it is not marked fixed. The recorder rejects an unexpected closing state rather than replaying again or fabricating a completed frame.
