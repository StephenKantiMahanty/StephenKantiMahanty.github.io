# Independent usability and visual design review

Recommend **cinematic as the foundation**, retaining clarity's plain-language correction lesson and workbench's time inspection and paired-experiment ideas. Cinematic best satisfies the priority of a cool, engaging robotics learning project: its framed AUV, underwater light, instrument styling and explicit mission identity feel coherent, and its primary controls are discoverable before the scene. This is an expert design judgment, not user-study evidence.

## Scope and evidence

Read shared/PROJECT_BRIEF.md, shared/EVALUATION.md, shared/REVIEW_TASKS.md and all three DELIVERY.md files. Candidate access was read-only. Inspected each kalman/index.html and existing browser audits/test output; viewed saved images with view_image. No build, new browser journey, test execution, candidate mutation or rival implementation work was performed. References below are relative to the run directory.

Images actually viewed:

- Clarity: worktrees/clarity/work/verification/kalman-desktop.png, kalman-phone-full.png, kalman-dropout-320.png.
- Cinematic: worktrees/cinematic/work/kalman-verification/desktop-ready.jpg, desktop-complete.jpg, phone-390.jpg, phone-320.jpg.
- Workbench: worktrees/workbench/work/verification/abyss/desktop-dropout.jpg, phone-390.jpg, phone-320.jpg.

Saved screenshots cover different scenarios/timestamps. They support layout and visual judgments, not a controlled comparison of numerical performance. The file named cinematic desktop-ready.jpg is paused in the sensor-bias preset at 10×; it is not evidence of the default nominal setup. Numerical trajectories and RMSE are not comparable across candidates merely because all use seed 42: their step sizes, starting states and noise differ.

## Requirement gates

PASS below means supported within the stated evidence scope; UNKNOWN is not a pass. No mandatory failure was established. Overall full acceptance gate is **UNKNOWN for all three** from this bounded visual review: saved evidence supports substantial acceptance work, but this reviewer did not independently audit filter algebra or prove independent authorship.

| Requirement | Clarity | Cinematic | Workbench | Actual evidence and limits |
|---|---|---|---|---|
| Engaging underwater robot, labeled truth/fix/estimate, uncertainty | PASS | PASS | PASS | Viewed screenshots and SVG/canvas descriptions in each kalman/index.html. Shapes supplement color. Workbench dropout band is particularly easy to read. |
| Initially paused, native play/pause/step/reset, finite summary | PASS (saved evidence) | PASS (saved evidence) | PASS (saved evidence) | DELIVERY journeys; cinematic ready/completed images; workbench browser-audit.json timedEndpoint; clarity keyboard-tuning.json records 0.5 s and focused Step. New interaction not exercised here. |
| Separate actual sensor noise and assumed process/measurement noise | PASS (structure/evidence) | PASS (structure/evidence) | PASS (structure/evidence) | Each HTML separates world from beliefs. Clarity keyboard-tuning.json records unchanged first fix 3.69 m after retuning. Workbench audit records R_A=.64/R_B=4 and identical replay. Cinematic delivery records first fix 6.80 m after changing R; raw interaction transcript not present in viewport audits. |
| Four scenarios, same-data comparison, repeatable mission | PASS (saved evidence) | PASS (saved evidence) | PASS (saved evidence) | Scenario controls in HTML, saved test summaries and delivery records. Workbench audit records dropout half-width .78→3.74 m; clarity dropout screenshot shows prediction-only at 33.5 s. Full scenario execution not repeated. |
| Live telemetry, raw/filter/dead-reckoning RMSE, teaching prompt/worked correction | PASS | PASS | PASS | Each HTML contains these sections; clarity full-phone and cinematic complete images show rendered lesson/metrics. Workbench lesson rendering below viewport was not visually captured in the artifacts viewed; content exists in HTML and learner feedback is reported in delivery. |
| Secret fourth card and regression verification | PASS (recorded tests) | PASS (recorded tests) | PASS (recorded tests) | Existing kalman-tests.txt / tests.txt / abyss/test-results.txt show 28/28, 30/30, 30/30 respectively; deliveries describe integration checks. Workbench audit records distinct tab launch. New launch/regressions not run. |
| Required widths, 44 px controls, keyboard focus | PASS (saved evidence) | PASS (saved evidence) | PASS (saved evidence) | Clarity kalman-320-audit.json: scrollWidth 305, overflow false, 44 px buttons; keyboard-tuning.json: solid 2.67 px outline. Cinematic audit-1440/320.json: overflow [], controls ≥44 px; 390/320 images viewed. Workbench browser-audit.json: matching client/scroll widths, shortTargets [], native keyboard step and R arrow journey. Saved audits are measurements, not physical touch testing. |
| Semantic plot equivalents, no autoplay, no per-frame announcements | PASS (structure/evidence) | PASS (structure/evidence) | PASS (structure/evidence) | Text equivalents/native controls present in HTML; saved paused states. Workbench audit explicitly records numeric outputs live=off; cinematic audits list only announcement as live region. Complete runtime announcement behavior not independently exercised. |
| No-JS fallback and reduced-motion behavior | PASS fallback / UNKNOWN OS behavior | PASS fallback structure / UNKNOWN browser behavior | PASS fallback / UNKNOWN OS behavior | HTML includes explanations. Clarity/workbench deliveries record script-disabled sandbox checks; workbench audit records fallback visibility and CSSOM reduced-motion rule. Cinematic explicitly did not emulate either preference or script disabling. Source presence does not establish OS behavior. |
| Exact fixture, Joseph update, valid Q, truth isolation, deterministic streams, long-run PSD | UNKNOWN independently; recorded tests pass | UNKNOWN independently; recorded tests pass | UNKNOWN independently; recorded tests pass | Saved suite outputs and delivery describe numerical checks. No independent numerical-core review or rerun in this review; defer to technical reviewer. |
| Independent implementation | UNKNOWN | UNKNOWN | UNKNOWN | Authors assert independence in DELIVERY; a completed artifact cannot prove process independence. |
| Screen-reader usability, formal contrast/conformance, physical touch, performance | UNKNOWN | UNKNOWN | UNKNOWN | No actual sessions/benchmarks supplied for these checks. Test-suite duration is not app performance. |

## Dimension scores

Provisional scores use frozen weights. Numerical and maintainability scores have lower confidence: they reflect saved verification and declared structure, not a new code audit. Weighted totals are design selection aids, not proof that the full gate passed.

| Dimension | Weight | Clarity | Cinematic | Workbench |
|---|---:|---:|---:|---:|
| Visual quality / engagement | 30% | 8.3 | 9.2 | 8.7 |
| Learning clarity / usability | 30% | 9.0 | 8.3 | 8.5 |
| Functionality / numerical correctness (provisional) | 20% | 8.5 | 8.7 | 8.8 |
| Accessibility / responsiveness | 10% | 8.5 | 8.4 | 8.4 |
| Maintainability / performance (provisional; unbenchmarked) | 10% | 8.0 | 8.0 | 8.0 |
| Weighted total /10 | | **8.56** | **8.65** | **8.57** |

The narrow margin matters: cinematic wins for the specified robotics-engagement priority, not by overwhelming the alternatives on every dimension.

## Identical learner tasks

| Task | Clarity | Cinematic | Workbench |
|---|---|---|---|
| Explain one correction | Best novice wording: prediction, innovation, gain, corrected depth; matrices disclosed later. Notebook anchor helps discovery. | Four live-number columns plus exact introductory fixture; visible lesson leans into equations earlier and sits below debrief. | Ordered worked steps with current values; first fix arrives at 1 s, so a single 0.25 s step does not yet demonstrate correction. HTML explains cadence, but beside lesson rather than Step. |
| Run dropout and identify growing uncertainty | Evocative scenario name plus literal no-fix interval; prediction-only status visible in narrow screenshot. | Select hides alternatives until opened; dedicated confidence-versus-error chart makes failure diagnosis strongest. | Visible scenario buttons and shaded fault region make dropout most legible; saved image plainly shows expanding band. |
| Replay identical data at changed R | One-click full-mission alternative comparison is easy, but it compares full-run metrics against a potentially partial live display; scope label is essential. | Save baseline, change R, replay is explicit and controlled, but repeated resets/runs add interaction cost. | Pin A, retune B at same timestamp gives strongest direct paired experiment; scrubber can inspect exact failure moments. A/B notation adds novice load. |
| Reset and reach endpoint | Clear controls above scene; fixed 3.3× speed means fewer transport choices. | Controls above scene and selectable speed; completed capture shows debrief, error plot and replay. | Reset/To end/scrubber offer quickest diagnosis, but transport is below the plot and outside initial saved views. |
| Keyboard control use | Saved focused Step and tuning evidence; native controls. | Saved delivery reports Enter/arrow/End journeys; viewport audits measure sizes, not keyboard operation. | Audit records Step and R arrow/focus; native controls and skip link. |

## Material issues and retained strengths

**Cinematic:** strongest foundation. Desktop scene is tall (audit: about 647 px); the initial 900 px capture cuts off the legend and telemetry. On 390 px, the plot reaches the bottom of the first viewport and settings/legend require scrolling. The 320 px audit records a 5,973 px document: long enough to make experiment → lesson → retuning travel costly. Add a direct lesson link near the introduction/transport, shorten novice-facing math, and keep comparison instructions near the baseline action. Small monospace axis and helper text remain a visual readability concern; no contrast failure is claimed without measurement. Preserve the AUV frame, light beams, above-scene controls, selectable playback, confidence/error plot and endpoint debrief.

**Clarity:** best explanatory voice and highly coherent paper/ocean contrast. Distinctive but gentler than the requested robotics console; the rounded sub communicates friendly exploration more than a serious instrument. The full phone capture shows substantial separation between live plot, settings and live correction, requiring scroll travel to connect cause and numbers. Preserve its short prediction/listen/trust explanation, optional matrices, explicit standard deviation→variance explanation and bias challenge. Keep Apply & reset semantics explicit if retained; its settings apply model differs from workbench's immediate reprocessing.

**Workbench:** strongest experiment workflow and visible fault interpretation. Main usability issue is transport placement: desktop 900 px and both saved phone views show scenarios and plot but no Play/Step controls; HTML confirms transport follows the figure. Move transport above the scene before adopting this structure. A/B identity, pinned default reference and several variance outputs require more prior knowledge than clarity's narrative. Preserve the scrubber, To end, Match actual noise, labeled fault window, same-time paired metrics and answer feedback. Its phone plot is more legible than a letterboxed desktop chart. Workbench lesson/endpoint layout below the initial viewport remains visually unverified in this review.

## Foundation and compatible synthesis

Use cinematic's coherent visual system and transport placement. Adopt clarity's beginner wording and progressive math disclosure, plus a conspicuous follow-one-correction link. Adopt workbench's scrubber and paired comparison concept only with explicit timestamp and dataset labels; immediate reprocessing must be explained as replaying recorded history, not changing firmware in mid-mission. Add its short learner prediction/feedback interaction.

Do not combine all three setting semantics or transplant numerical defaults merely to match screenshots. Choose one application rule and one model, preserve same-data comparison, and reverify the integrated lesson against its actual live numbers. Final integration still needs independent numerical acceptance and browser journeys. No candidate edits were made by this reviewer.
