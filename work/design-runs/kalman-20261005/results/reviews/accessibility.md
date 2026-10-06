# Independent functionality and accessibility review

Reviewed 2026-10-05. Recommendation: **Clarity as foundation**, retaining selected experiment and teaching ideas from the other candidates. Clarity has an **UNKNOWN overall mandatory gate** because some required behavior lacks execution evidence; Cinematic and Workbench have **FAIL accessible-control semantics gates** in addition to unknown checks. None should be described as fully accessibility verified.

## Scope and evidence standard

I did not build these candidates. I read shared/PROJECT_BRIEF.md, shared/EVALUATION.md, shared/REVIEW_TASKS.md, all three DELIVERY.md files, UI HTML/JS/CSS, numerical test definitions, saved test results and browser audits. I visually inspected each saved 320px screenshot and Clarity's desktop comparison capture, Cinematic's completed desktop capture, and Workbench's desktop dropout capture. Candidate access was read-only. No server, new build, new browser journey, test execution, or candidate edits occurred. This report is the only write.

Paths below are relative to the run directory; candidate-local paths are prefixed by worktrees/{candidate}/. PASS means supported by inspected source or actual saved artifacts for the stated check, not an independently rerun session. Delivery prose alone is identified as reported evidence. UNKNOWN is not a pass. Screenshot appearance is not a contrast measurement, speech test, or physical-device test.

## Requirement gates

| Requirement | Clarity | Cinematic | Workbench | Evidence and boundary |
|---|---|---|---|---|
| Static standalone activity and Secret fourth-card integration | PASS | PASS | PASS | Local HTML/script/style assets; saved regression logs pass fourth-card/footer and Worker routes. Deliveries report actual launch. Workbench browser-audit.json records a distinct tab; Clarity explicitly does not establish new-window count. |
| Real filter, seeded data, independent actual/assumed noise, prediction-only dropout | PASS, saved tests | PASS, saved tests | PASS, saved tests | tests/kalman.test.cjs defines exact state/gain/covariance fixture, truth isolation, deterministic streams, Q and dropout assertions; saved logs show 28/28, 30/30, 30/30 total passes respectively. Numerical correctness remains subject to the technical review; I did not rerun these tests. |
| Four scenarios, finite mission, RMSE, teaching and mismatch explanation | PASS | PASS | PASS | UI source has nominal/dropout/current/bias presets, worked values, actual error/interval distinction and finite summary. Saved tests cover scenarios/endpoints; browser evidence is detailed below. |
| Replay and same-data tuning comparison | PASS | PASS, source plus reported journey | PASS | Clarity keyboard-tuning JSON retains first fix 3.69m; comparison handler reruns existing data. Cinematic rebuild retains data for tuning, clears baseline only for world changes; detailed comparison journey is in DELIVERY, not the layout audits. Workbench browser audit records R_A=.64/R_B=4, identical replay and paired RMSE .367/.371. |
| Native keyboard operation, focus and no unrelated key interception | PASS, sampled | PASS, sampled | PASS, sampled | Native controls and focus CSS; Clarity saved Step outline and keyboard tuning; other deliveries report Enter/arrow journeys and Workbench audit records them. No global keydown shortcut handler found; Workbench Enter handler is scoped to seed. Exhaustive tab traversal and endpoint focus behavior are UNKNOWN for all. |
| Accessible tuning/control values | PASS for direct-value tuning | **FAIL** | **FAIL for time scrubber** | Cinematic R/q ranges store base-10 exponents without aria-valuetext. Workbench scrubber stores 0–240 indices without seconds-valuetext. Workbench direct R/q values and Clarity standard-deviation values have meaningful native numeric values. |
| Semantic equivalents, shapes, silent playback telemetry | PASS, source | PASS, source | PASS, source | Labeled SVG/canvas plus readable current state, RMSE and worked correction. Action/endpoint announcements are separate from numeric playback. Workbench explicitly turns output live behavior off. Actual screen-reader speech remains UNKNOWN. |
| 1440×900, 390×844, 320×740 layout and 44px simulation controls | PASS, sampled artifacts | PASS, sampled artifacts | PASS, sampled artifacts | Saved viewport audits show no horizontal overflow; saved 320px captures agree for visible content. Audits substantiate measured controls, not every link at every scrolled state. Physical touch usability is UNKNOWN. |
| Paused start and reduced motion | PASS paused start; UNKNOWN execution under preference | PASS paused start; UNKNOWN execution under preference | PASS paused start; UNKNOWN execution under preference | Timers start on explicit play. Reduced-motion CSS exists; Workbench audit captures loaded CSSOM. None records an actual OS/media preference toggle. CSS inspection is not a runtime pass. |
| No-JS explanatory fallback | PASS, source and reported sandbox execution | UNKNOWN execution; PASS markup | PASS, source and saved audit journey | Cinematic explicitly reports no browser JS-disable capability. Clarity fallback has initially disabled action buttons; Workbench fallback explains the model but leaves dead simulation controls enabled. |
| Independent implementation provenance | UNKNOWN independently | UNKNOWN independently | UNKNOWN independently | Separate implementations and deliveries asserting no rival access; this review cannot establish historical access from finished artifacts. |
| Overall frozen mandatory gate | **UNKNOWN** | **FAIL** | **FAIL control-value subgate; overall FAIL** | Unknown execution checks prevent an unconditional pass; known semantic defects must be corrected. Workbench's scrubber failure affects its added time-inspection flow. |

## Comparable journeys and actual artifacts

**Clarity.** `work/verification/kalman-desktop-audit.json`, `kalman-phone-audit.json` and `kalman-320-audit.json` record widths 1425/375/305 for the requested viewports, 44px playback buttons, and a compact SVG. Desktop audit also measures sliders, inputs, scenario labels and disclosures. `kalman-keyboard-tuning.json` records Step focus with a solid 2.67px outline and the same 3.69m fix after changing assumed sensor sigma to 4 and acceleration sigma to .09. `kalman-blackout-audit.json` shows 33.5s, no fix, prediction-only explanation, interval 8.14–19.23m and error 1.81m. `kalman-nominal-audit.json` shows 60s and progress 120; `kalman-bias-audit.json` shows 60s, error 1.90m versus modeled half-width .98m and 33% coverage. Its bias progress field is empty, so that field does not prove progress completion. Delivery reports current at 23s and nominal/dropout/bias endpoints; full current endpoint evidence is numerical rather than a saved UI endpoint audit.

Clarity `kalman/app.js:89` applies controls explicitly, clears comparison and resets paused; `:105` compares complete runs on the existing dataset, with an explicitly full-60s table rather than silently comparing unequal elapsed times. `:80–104` supports pause, step, reset and endpoint replay. Plot text gives truth, fix, estimate, velocity, interval and actual error; worked correction switches meaningfully to prediction only. The desktop file named comparison captured the comparison controls before a results table is visible: it is not visual proof of a completed comparison. Delivery supplies the reported completed comparison numbers, and source supplies its implementation.

**Cinematic.** `work/kalman-verification/audit-{1440,390,320}.json` records no overflow, 44px enumerated controls and ready/paused state. `desktop-complete.jpg` shows a completed bias run, error 1.64m versus .46m half-width, 33.3% coverage, debrief and replay. DELIVERY reports all four UI endpoints, Enter journeys, dropout half-width .48→1.05m from 20→24s, and first fix 6.80m unchanged after R retuning; those journey details are not machine-readable in the layout audits. `kalman/app.js:42–86` supports deterministic reset/replay and baseline lifecycle, and `:89–139` provides current numerical equivalents, scoped table headers, worked correction and same-data endpoint debrief. Initial disabled controls avoid misleading play/step/reset operation before script load.

**Workbench.** `work/verification/abyss/browser-audit.json` records the three viewport widths, no short audited targets, silent outputs, Step to .25s/first correction at 1s, dropout half-width .78→3.74m from 19→35s, paired comparison, 60s timed completion with Step disabled, keyboard R .0025→.0026, and sandbox no-JS fallback. Its saved desktop dropout screenshot demonstrates the expanded band and fault window; its phone capture places the plot before playback controls. `kalman/app.js:14–36,118–137` supplies deterministic replay, world reset, scenario pressed states, direct end, scrubbing and paired retuning. Retuning recomputes recorded history at the current cursor; `setTuning()` does not pause active playback. This is consistent with an interactive experiment but needs care when describing a fixed-time comparison. Learner feedback has its own polite region and playback outputs explicitly remain silent.

Saved numerical/regression outputs: Clarity `work/verification/kalman-tests.txt` (28 passed), Cinematic `work/kalman-verification/tests.txt` (30 passed), Workbench `work/verification/abyss/test-results.txt` (30 passed). These are local fixture regressions, not deployed-service or cross-browser verification. Different dt, disturbance models, noise settings and fix rates mean cross-candidate RMSE magnitudes are not a fair quality ranking.

## Material issues and limitations

1. **Cinematic: high-priority incorrect native tuning value semantics.** `kalman/index.html` R/q inputs use values such as −.19382 and −2.19382; `kalman/app.js:21–33` exponentiates these into .64 and .0064 variances. No aria-valuetext mapping exists. The label says variance while the native slider value is an exponent. The displayed output inside the label does not correct the slider's programmatic value. Supply physical variance and units as accessible value text on each change. Actual speech/accessible-tree output was not tested; the source-level mismatch is established.

2. **Workbench: medium-priority time-control semantics.** `kalman/index.html:72` exposes an index range 0–240 under “Inspect mission time”; `kalman/app.js:87,127` renders seconds separately but never maps the accessible slider value to seconds. At 35s the underlying value is 140. Add seconds-valuetext and an association to the readout. The separate silent output is helpful text, but not a replacement for meaningful slider values.

3. **Workbench: phone control discovery and no-JS affordances.** Playback follows the plot (`index.html:67–72`), outside the inspected 320px initial viewport; Clarity/Cinematic place it above. Workbench no-JS explanation passes, but enabled inert controls remain visible. These are usability issues, not evidence that the underlying playback is broken. Disable or hide unavailable actions before initialization; place transport before the scene if borrowing this layout.

4. **All: incomplete assistive and motion execution evidence.** No actual screen reader, OS reduced-motion toggle, physical touch, measured contrast, zoom/text-spacing audit, or full keyboard traversal is documented. No per-frame announcement mechanism was found, but speech behavior cannot be certified from DOM alone. CSS disables passive effects, not deliberate simulation playback; paused start and Step provide user control. Test the preference before declaring its execution passed.

5. **Clarity: comparison visual range risk.** `kalman/app.js:16–21` sets plot limits from the applied run before comparison; `:105–111` adds an alternate trace without recomputing that domain. Extreme alternative R could place that trace outside the clipping region. The numerical table remains useful. This is a source-inferred risk, not an observed failing screenshot; test boundary tuning or fit the axis to both traces.

## Dimension scores /10

Scores are review judgments from inspected artifacts, not user-study results or benchmarks. Maintainability/performance reflects organization and static dependency footprint; runtime performance is unmeasured. Weighted total is descriptive only and cannot override a failed/unknown gate.

| Dimension (frozen weight) | Clarity | Cinematic | Workbench |
|---|---:|---:|---:|
| Visual quality / engagement (30%) | 8.5 | 9.0 | 8.5 |
| Learning clarity / usability (30%) | 9.0 | 8.5 | 8.5 |
| Functionality / numerical evidence (20%) | 9.0 | 9.0 | 9.0 |
| Accessibility / responsiveness (10%) | 8.5 | 7.5 | 8.0 |
| Maintainability / performance evidence (10%) | 8.5 | 8.0 | 8.5 |
| Weighted total | **8.75** | **8.60** | **8.55** |

## Foundation and compatible retained ideas

Use **Clarity** for its straightforward controls, explicit pending/applied settings, accessible direct-value tuning, worked dropout explanation, detailed numerical plot equivalent and strongest saved keyboard evidence. Preserve its start-paused and event-only announcement behavior. The recommendation is conditional on closing unknown execution checks and checking comparison-domain limits.

Retain **Cinematic's signed error-versus-confidence teaching plot**, with its readable numeric equivalent and optional playback speed. Its baseline-clear rule on world changes is also useful; do not copy logarithmic slider semantics unchanged.

Retain **Workbench's optional scrub/end inspection**, paired coverage table, match-to-actual-noise action and learner feedback. Put playback above the scene and map scrubber values to seconds. If adopting pin-and-retune, choose one coherent comparison model and explain whether it rewinds or reprocesses the full recorded history; do not combine incompatible timing/state behaviors.

The coordinator should execute the final integrated journeys and regressions. This bounded review does not substitute saved candidate evidence for final verification.
