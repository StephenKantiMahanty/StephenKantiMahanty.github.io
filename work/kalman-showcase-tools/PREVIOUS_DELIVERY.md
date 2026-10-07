# Abyss / Kalman Lab

## Current design and writing revision

The lab now loads the portfolio's shared stylesheet and uses its Courier typography, dark backgrounds, green circuit palette, grid, and bordered panels. The introduction, lessons, tuning help, error explanation, and mission results use connected explanations and concrete examples derived from all three user-supplied writing samples. The samples themselves are not included in the site.

Checked the revised page in Edge at 1440, 390, and 320 px. Narrow layouts have no elements extending beyond the viewport; setup controls and lesson feedback were visually inspected at 320 px. The nominal endpoint displays the revised results correctly. All 37 existing tests and the app syntax check pass. Screenshot: `work/verification/kalman-restyle/desktop.png`. These checks do not establish cross-browser or screen-reader coverage.

The historical integration report below describes the original parallel-design build. Its preserved worktree and screenshots precede this revision; the current root `kalman/` files are the updated deliverable.

## Original integration report

The finished static lab is integrated into the original portfolio at [kalman/index.html](kalman/index.html), with its fourth launch card in Secret. Three independent implementations were compared; the cinematic foundation combines clearer teaching and time-inspection ideas from the alternatives. Nothing was published, pushed or committed.

## Preview

Run `node kalman/preview.cjs` from this worktree. It defaults to **8314**, bound to `127.0.0.1`.

- Lab: <http://127.0.0.1:8314/kalman/>
- Launch journey: <http://127.0.0.1:8314/secret/>
- Fixed-size and script-disabled fixtures: <http://127.0.0.1:8314/tests/kalman-preview.html>
- Optional override: set `PORT` before starting the server.

No build, backend, CDN or dependencies are needed.

## Integrated behavior

- R and q sliders expose physical variance and units through `aria-valuetext` on every change. Actual-noise controls also expose standard deviations with units. Every `output` explicitly sets `aria-live="off"`; the chart equivalents are readable text, and announcements occur for user actions and mission completion.
- Time inspection stays above the scene. Its readout and accessible value use seconds. Scrubbing pauses, clears playback accumulation, updates elapsed scores and worked numbers, and hides the debrief when leaving the endpoint. **To end** inspects all 60 seconds without starting playback. Controls have at least 44 px targets, including radio labels.
- **Match actual noise** sets the exact floating-point squares `R = sensorSigma ** 2` and `q = accelSigma ** 2`, including zero q. An explicit physical-value anchor at the matched slider tick prevents quantization from changing the value on an unrelated input or replay. Spoken numbers suppress floating-point display artifacts; stored values remain exact. Tuning pauses and rewinds the same data and retains the baseline. Changes to seed, scenario or actual noise regenerate data and clear it.
- Scenario help reflects the current match or mismatch and explains that matching random variances does not remove current or sensor bias.
- An intro/control anchor leads directly to the live numerical correction. Plain-language prediction/listening/correction explanations remain visible. Equations and model details start collapsed. The exact numerical example remains available. A dropout question provides specific feedback for correct, incorrect and missing answers.
- Depth bounds include truth, fixes, estimate, dead reckoning, saved estimate and both uncertainty edges. Error-chart bounds include the displayed current/baseline errors and uncertainty. The world generator remains separate from estimation; truth is used only for drawing and evaluation.
- The numerical core rejects nonfinite/negative q, nonfinite/nonpositive R (even without a fix), invalid noise standard deviations, overflowing noise variances, invalid seeds/scenarios, invalid step/acceleration inputs and nonfinite fixes.
- All buttons, inputs and selects start disabled and are enabled after initialization. A real script-disabled sandbox displays the explanatory fallback; native details and references remain available.

## Actual verification

`node --test tests/*.test.cjs`: **37/37 passed, zero failures**. The full final output is in [tests.txt](work/verification/kalman-final/tests.txt). Seven new integration tests cover invalid numerical input, exact match mapping, all-trace bounds and the actual app's data/baseline/scrub/gain lifecycle using a minimal DOM and spies at the model boundary. Existing tests retain the exact Kalman fixture, 100,000 covariance steps, deterministic replay, truth isolation, scenario timing, Worker/private-file routing and four-card Secret navigation.

`node --check` passed for `kalman/{model,controls,app}.js` and `kalman/preview.cjs`. `git diff --check` passed. Git emitted existing LF/CRLF notices. New source files were also checked for trailing whitespace. Commands and evidence are indexed in [CHECKS.md](work/verification/kalman-final/CHECKS.md).

Fresh Edge checks used both the standalone page and the checked-in fixture. Final fixture dimensions were confirmed as **1440×900, 390×844 and 320×740**. Inner document widths were 1425, 375 and 305 px respectively (vertical scrollbar space); there was no lab horizontal overflow. Canvas backing sizes followed the rendered sizes. All measured buttons, ranges, selects, seed controls, summaries and radio labels were at least 44 px high. Expanded exact-example/model content also fit at 320 px. The outer fixture intentionally accommodates a 1440 px iframe; its own horizontal scrollbar is not lab overflow.

Verified browser journeys:

| Journey | Observed result |
| --- | --- |
| Secret launch | Fourth card opened the initialized lab in a new tab. |
| One correction by keyboard | At 0.2 s: prediction 7.021 m, fix 6.801 m, gain 0.610, corrected depth 6.887 m. |
| Same-data R comparison | R increased from 0.64 to 16 m²: same first fix, gain 0.610 → 0.059; baseline retained; complete RMSE 0.193 → 0.232 m. |
| Exact noise match | Rewound while retaining data/baseline; nominal RMSE returned to 0.193 m. Zero actual acceleration matched q = 0 and reached a finite endpoint. |
| Dropout | Half-width ±0.46 m at 19.8 s → ±3.73 m at 35.8 s, no corrections while missing → ±1.45 m at the returning fix at 36 s. Correct/incorrect learner feedback checked. |
| Scenario endpoints/replay | Nominal/dropout/current/bias filter RMSE: 0.193/0.236/0.351/1.618 m. Each replay reproduced its endpoint; 300/220/300/300 fixes. |
| Scrub/end/reset | Seconds-valuetext, paused inspection, endpoint disables start/step, scrubbing backward hides summary and re-enables playback, reset returns to zero. |
| Playback/keyboard | Enter activates step/play/pause; real playback advanced to 53.4 s before pause; native slider arrow/Home/End/PageUp keys operate. Focus outline observed on R. |
| Baseline/world lifecycle | Explicit clearing and seed/world changes removed saved baseline. Fractional seed was natively invalid and left the current 0.2 s step intact. |
| No JavaScript | Sandbox without `allow-scripts` displayed fallback and disabled all 21 actions/inputs; exact example expanded and remained readable. |

Evidence: [journeys.json](work/verification/kalman-final/journeys.json), [final-viewports.json](work/verification/kalman-final/final-viewports.json), [layouts.json](work/verification/kalman-final/layouts.json), [physical-values.json](work/verification/kalman-final/physical-values.json), [keyboard-focus.json](work/verification/kalman-final/keyboard-focus.json), [nojs.json](work/verification/kalman-final/nojs.json), [invalid-seed.json](work/verification/kalman-final/invalid-seed.json), [secret-launch.json](work/verification/kalman-final/secret-launch.json), and [console.json](work/verification/kalman-final/console.json).

Visually inspected captures: [desktop scene](work/verification/kalman-final/desktop-mission.png), [390 px scene](work/verification/kalman-final/phone390-mission.png), [320 px scene](work/verification/kalman-final/phone320-mission.png), [320 px correction](work/verification/kalman-final/phone320-correction.png). Initial-page and script-disabled captures are in the same directory.

## Limits and review

No application console errors were captured. The saved log includes two errors from an unrelated `chrome-extension://` script; sandbox script-blocking diagnostics are expected in the no-JS fixture. Browser automation had one scrolling timeout despite the page moving; the resulting viewport was read and captured. Two unsupported read-only DOM probes were replaced with supported frame/locator reads; those probe errors were not application errors.

The `prefers-reduced-motion: reduce` rule was inspected: it disables transitions/animations and restores automatic scrolling. There is no forced autoplay or decorative animation. Actual OS preference switching, screen-reader speech, physical touch, cross-engine behavior, formal WCAG conformance and performance benchmarks were **not tested**. Computed focus and DOM semantics are evidence only for those specific checks.

This remains a RoboSub-inspired, one-axis teaching simulation with processed position fixes, independent Gaussian per-step acceleration disturbance and deliberate current/bias mismatch. Its 95% interval expresses model assumptions; it is not a safety guarantee or official scoring.

[Checker - 6.1-Sol]: **9.2/10**, cycle 1 of at most 3. Mandatory implementation and supported journey checks passed. The cinematic scene remains coherent, the numerical fixtures/default recordings are unchanged, and the formerly failed control semantics are fixed. No required code fixes remain. The manual accessibility and cross-engine checks above remain unknown.

## Finished files

The coordinator reviewed and copied the final source, tests and evidence into the original repository, then reran all 37 tests, syntax and diff checks successfully. Native keyboard launch from Secret opened a distinct tab. Original-site browser checks confirmed the worked correction, physical R/seconds values, all four endpoints and prediction-only dropout; desktop1440x900/phone390x844/320x740 document widths equaled scroll widths. Fresh captures and scenario data: `work/verification/kalman-final/original-{1440,390,320}.png` and `original-audit.json`. An additional console/learner-feedback browser call timed out and is not counted as a passing check; the completed builder's feedback/console checks above remain the evidence for those journeys.

Preserved final working copy: `work/design-runs/kalman-20261005/worktrees/final`, branch `design/kalman-final`. Comparison and fresh reviews: `work/design-runs/kalman-20261005/COMPARISON.md` and `results/reviews/`. The canonical Kalman PDF returned404 during research; the activity uses the verified Temple University archive of Welch/Bishop's original SIGGRAPH course document. Product source matches the reviewed final working copy; this delivery adds original-workspace verification.

- `kalman/index.html`, `kalman/styles.css`, `kalman/app.js`, `kalman/model.js`, `kalman/controls.js`, `kalman/preview.cjs`
- `tests/kalman.test.cjs`, `tests/kalman-integration.test.cjs`, `tests/kalman-preview.html`
- Existing foundation integration: `secret/index.html`, `tests/secret-projects.test.cjs`, `README.md`
- `DELIVERY.md`, `work/goal-loop-state.md`, `work/verification/kalman-final/`
