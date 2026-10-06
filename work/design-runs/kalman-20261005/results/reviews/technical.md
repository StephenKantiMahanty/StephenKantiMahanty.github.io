# Independent technical review

Reviewed 2026-10-05. I did not build any candidate. Read PROJECT_BRIEF.md, EVALUATION.md, REVIEW_TASKS.md, all three DELIVERY.md files, numerical cores, numerical tests and playback/comparison code. Candidate access remained read-only; this report is the sole new artifact. No build, preview, new test files, or candidate edits were performed.

**Recommendation: cinematic as the technical foundation. All three pass the inspected numerical requirements; none has a demonstrated numerical blocker. The complete mandatory gate remains UNKNOWN for all three because this technical review cannot independently establish every visual/accessibility requirement or independent-build provenance.** Saved browser audits support specific checks, not blanket conformance.

## Actual verification and requirement gates

Ran `node --test tests/*.test.cjs` separately from each candidate root. All completed with exit code 0: clarity 28/28, cinematic 30/30, workbench 30/30; zero failures, skips or cancellations. These are reviewer-observed executions of existing candidate-authored tests, not a new independently implemented reference solver.

| Requirement | Clarity | Cinematic | Workbench | Actual evidence |
|---|---|---|---|---|
| Exact required fixture | PASS | PASS | PASS | First numerical test checks both state components, gain and all covariance entries against supplied analytical fixture. |
| Valid Q and known acceleration | PASS | PASS | PASS | Core inspection plus zero-initial-covariance prediction tests; Q=qGGᵀ for independent acceleration held constant over h. |
| Joseph covariance correction | PASS | PASS | PASS | Inspected algebra; analytical fixture and long-run covariance tests pass. |
| Truth isolated from estimator | PASS | PASS | PASS | Poisoned truth leaves states/covariances unchanged; cinematic/workbench also assert gains. Initial state is a fixed known launch state, not read from sampled truth. |
| Seed replay; tuning preserves measurements | PASS | PASS | PASS | Deterministic replay tests and separate generator/estimator inputs; dropout consumes sensor random draws even when fixes are missing. |
| Prediction-only dropout and recovery | PASS | PASS | PASS | Every dropout row equals its prediction; covariance growth and reacquisition contraction asserted. |
| Finite symmetric PSD covariance | PASS | PASS | PASS | 30,000 aggregate clarity updates; 100,000 aggregate cinematic updates across four 25,000-step runs; 100,000 workbench updates. Finite state/covariance, nonnegative diagonal and determinant tolerance checked. These are tested ranges, not proofs for arbitrary inputs. |
| Units, confidence/error distinction, mismatch limits | PASS | PASS | PASS | HTML model explanations and live worked values agree with inspected model; sigma versus variance is explicit. |
| Fixed simulation timing and finite endpoint | PASS | PASS | PASS | Fixed h in cores, 60 s numerical endpoints; playback reveals fixed rows rather than integrating wall-clock dt. |
| RMSE/raw denominators; same-data comparison | PASS | PASS | PASS | Raw uses available fixes; estimator/dead reckoning use post-initial steps. Comparison code shares generated data and scores consistent horizons. |
| Secret integration and existing regression suite | PASS | PASS | PASS | Rerun four-card/footer, navigation and local Worker/private-upload tests. Production service behavior is not established by these fixtures. |
| 1440/390/320 layout measurements | PASS (saved) | PASS (saved) | PASS (saved) | Saved candidate-specific JSON audits show no horizontal overflow and 44 px controls/empty short-target lists. No fresh browser run by this reviewer. |
| Full keyboard/assistive-tech/reduced-motion behavior | UNKNOWN | UNKNOWN | UNKNOWN | Delivery descriptions and native controls support keyboard journeys; real screen-reader and OS reduced-motion sessions absent. CSS/source inspection is not those runtime checks. |
| Independent implementation provenance | UNKNOWN | UNKNOWN | UNKNOWN | Deliveries attest independence; implementations differ, but a code review cannot establish development history. |
| Entire mandatory brief gate | UNKNOWN | UNKNOWN | UNKNOWN | No numerical failure found; visual quality, all interactive/accessibility details and provenance require combined reviewer/coordinator evidence. |

Saved artifacts consulted: clarity `work/verification/kalman-*-audit.json` and `kalman-keyboard-tuning.json`; cinematic `work/kalman-verification/audit-{1440,390,320}.json`; workbench `work/verification/abyss/browser-audit.json`. Broader historical site artifacts are not new Kalman evidence. Syntax/diff success is recorded in deliveries, but was not rerun here. No benchmark, user study, physical touch test, cross-engine validation or formal WCAG audit is established.

## Numerical and timing findings

All cores implement x=[depth, vertical velocity], F=[[1,h],[0,1]], G=[h²/2,h]ᵀ, H=[1,0]. q has units m²/s⁴, Q entries have units m², m²/s and m²/s²; R has units m². Clarity's predictor accepts acceleration **standard deviation** and squares it internally; cinematic and workbench accept **variance**. Their APIs must not be exchanged without conversion.

Clarity `kalman/filter.js:11` and cinematic `kalman/model.js:20` propagate both covariance cross entries, then explicitly symmetrize Joseph output. Workbench `kalman/engine.js:39` assumes symmetric input and mirrors its calculated cross entry; `correct` at line 47 uses the correct expanded Joseph equations for that invariant. This is valid for every generated state, but less general for an external asymmetric covariance input. No clipping covariance to hide negative eigenvalues was found.

All seeded generators use deterministic integer mixing and Box–Muller Gaussian samples. Physics and sensor draws are consumed on every tick; tuning is absent from physical computations. Sharing one RNG is sound because draw counts are fixed. Truth is used for visualization/scoring only. Workbench combines scoring with `run`, but poisoning tests confirm it cannot affect filter states. None models a hidden truth-based feedback controller.

| Candidate | h / steps | Fix cadence | Playback | Confidence multiplier |
|---|---|---|---|---|
| Clarity | 0.5 s / 120 | Every step | 150 ms interval, nominal 3.33× | 2, correctly described as about 95% |
| Cinematic | 0.2 s / 300 | Every step | rAF accumulator, selected 1×/4×/10× | 1.96 |
| Workbench | 0.25 s / 240 | Every fourth step, 1 s | 125 ms interval, nominal 2× | 1.96 |

Cinematic `app.js:62` caps each wall-time contribution at 0.25 s and consumes complete fixed steps. Under a long frame stall playback slows rather than advancing full elapsed wall time; numerics remain deterministic. Clarity/workbench interval timers likewise slow under throttling. All pause on hidden tabs. Fault windows are evaluated at the tick endpoint and apply the disturbance to that interval; this is a discrete convention, consistent between world and estimator commands, with a possible one-step interpretation difference from continuous-time onset wording.

Reruns reproduce delivery nominal filter/raw RMSE: clarity 0.4532/1.2253 m; cinematic 0.192692/0.829370 m; workbench 0.367133/0.816008 m. These are **not comparable estimator rankings**: starting states, commands, disturbance strengths, h, fix cadence and fault strengths differ. Bias produces poor coverage in every design, correctly illustrating confidence versus actual error. Nonzero launch covariance despite a known simulated launch is disclosed; nominal coverage is not a calibration study.

## Scores and material issues

Technical dimension scores are subjective /10, grounded in inspection and passing tests.

| Technical dimension | Clarity | Cinematic | Workbench |
|---|---:|---:|---:|
| Numerical algebra and units | 9.5 | 9.5 | 9.3 |
| Isolation and deterministic replay | 9.5 | 9.5 | 9.5 |
| Timing and comparison semantics | 8.5 | 9.3 | 9.0 |
| Test evidence and edge coverage | 8.7 | 9.2 | 9.5 |
| Maintainability | 9.0 | 9.0 | 9.0 |

For the frozen evaluation dimensions, functionality/numerical correctness (20%) scores are **9.0 / 9.4 / 9.3**, respectively. Maintainability/performance (10%) scores are **8.8 / 9.0 / 9.0**, based on source architecture and bounded mission sizes, with performance explicitly unmeasured. Visual engagement (30%), learning usability (30%) and accessibility/responsiveness (10%) are **unscored by this technical reviewer**; no fabricated weighted overall score is supplied.

No blocker observed. Integration risks and refinements:

- **Clarity comparison plot bounds:** `app.js:15` computes domain from active rows only; comparison creation at line 105 neither includes alternate rows nor recomputes limits. An alternate estimate outside the active domain can be clipped, despite the comment claiming comparison inclusion. Source establishes the omission; no failing seed was demonstrated here. Include both traces when choosing bounds before adopting the comparison UI.
- **Cinematic stale teaching claim:** `app.js:9` says default Q/R match actual noise even after actual-noise sliders are changed independently. Defaults only match the default world. Derive nominal help from current values or explicitly qualify it as the default configuration. This does not alter the estimator.
- **Workbench retuning during playback:** `app.js:22` recomputes history without pausing the interval. This remains a valid whole-history replay, but the timestamp can advance while a learner compares values. Pause on tuning/pinning if preserving an inspected instant is intended. Saved same-data audit does not test this active-playback case.
- **Workbench lower plot extent:** `app.js:40` omits truth/dead-reckoning minima while upper extent includes them. Extreme seeds can potentially hide negative portions of those traces; no specific failing seed was demonstrated. Include every displayed trace in both bounds.
- **Reusable API robustness:** clarity/cinematic do not reject invalid q/R; workbench validates run tuning but exposes mutable INITIAL and accepts symmetric-covariance assumptions. Native UI bounds make these nonblocking today. Add validation only if exposing/importing these APIs or datasets.

## Foundation and compatible retained ideas

Choose **cinematic** technically: generation, estimation and metrics are separate; Joseph algebra is explicit and symmetrized; playback has fixed-step accumulation and adjustable speed; baseline invalidation correctly follows world changes; tests cover actual sensor versus acceleration noise independently. Its lower RMSE is not a reason for selection. Preserve its fixed-step core and dataset identity rather than mixing three different worlds.

Retain workbench's once-per-second processed fixes with intermediate prediction steps, explicit q/R units, Match control, scrubber and independent metric summation/boundary tests if the selected experience benefits from those features. Changing cadence requires intentional regeneration and revalidation, not swapping constants alone. Retain clarity's accessible live correction narrative, explicit applied-versus-pending controls and clearly labeled full-mission comparison. Its sigma-based sliders require squaring before calling cinematic's variance-based core.

The coordinator should combine this report with visual/accessibility reviews and actual browser journeys, then rerun final numerical/regression checks after integration. No claim here upgrades an unsupported check to PASS.
