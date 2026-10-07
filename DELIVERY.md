# ABYSS / Underwater Navigation

## Typography and text formatting

The current page uses locally hosted IBM Plex Sans regular and semibold. The large compressed headline and serif italic accents are replaced by a moderate project title. Labels use sentence case, numbered section banners and scenario prefixes are removed, and engineering explanations form readable prose rows rather than three matching text columns. Main reading text and expanded specifications are at least 16 px, including on mobile. Chart axes follow the new font. Font licenses and exact source hashes are retained in kalman/fonts/.

The revision follows online USWDS and Practical Typography guidance, recorded in work/kalman-showcase-tools/TYPE-RESEARCH.md. Fresh type-verification.json proves both font weights load, the typography sizes/tracking, and layout fit at 320, 390, 768, 1280 and 1440 px. Final desktop/mobile screenshots in type-screenshots/ were reviewed. A vehicle label resize issue found during validation was fixed using its measured width even while offscreen rendering is paused.

The expanded model specification was also captured and visually inspected at 320 px: 16 px text in a 280 px content width, with no overflow. Final 44/44 Node tests, full interaction browser checks, focused motion checks, JavaScript syntax and whitespace checks pass. Requirement-level review: work/kalman-showcase-tools/TYPE-AUDIT.md. This typography revision is local and unpublished.

## Motion and writing revision

The current Kalman page adds staggered viewport entrances, sticky section navigation with reading progress, a moving scenario indicator, coordinated scene/telemetry/chart fades, animated model details, and smoother camera transitions. The vehicle drawing interpolates between computed replay samples; telemetry, covariance, benchmark values and exported data still use the exact numerical samples. Native scrolling retains wheel/touch behavior, and a live reduced-motion preference change immediately settles transitions and disables drawing interpolation.

The public copy now explains motivation and engineering decisions in first person, using the causal, context-first reasoning found in all three user-provided writing samples. The introduction begins “I built this simulation…” and the engineering notes connect sensor behavior to implementation choices. Numerical assumptions and the simulation label remain intact. Private writing samples are not included in public assets.

All five supplied research links were reviewed. The existing local Motion mini dependency implements the animations without adding a React component framework or new runtime dependency. Research and writing rationale: work/kalman-showcase-tools/MOTION-RESEARCH.md.

Fresh browser evidence: motion-verification.json records an unobscured section anchor/current-section marker, scenario animation activity and rapid-click settlement, animated disclosure with keyboard/repeated-click behavior, fractional drawing samples alongside integer numerical samples, stable pause and live reduced-motion handling. verification.json records the complete replay/camera/chart/fullscreen/export and responsive/fallback regression journeys. Screenshots in motion-screenshots/ were visually reviewed. Verification used headless Edge/Chromium with software WebGL, not a physical-device frame-rate benchmark. The revision is local and unpublished.

The project at /kalman/ is a portfolio showcase of autonomous underwater state estimation. Lessons, quizzes, worked corrections, tuning worksheets, and lab language have been removed. Secret launches the project as “Abyss / Underwater Navigation.”

## Engineering

The numerical core in kalman/navigation.js estimates east, north, depth, and three velocities. It propagates at 10 Hz using simulated global-frame inertial acceleration, fuses pressure depth at 5 Hz, three-axis Doppler velocity at 2 Hz, and four acoustic ranges at 1 Hz. Range observations are nonlinear; the EKF evaluates their Jacobians at the predicted state. Scalar NIS gating rejects updates above 9. Covariance updates use Joseph form and explicit symmetrization. The actual full 3×3 position covariance produces an oriented 95% joint ellipsoid using χ²(3) = 7.8147279.

Survey, acoustic blackout, multipath, and cross-current are deterministic 120 s missions with seed 42. Gated and ungated estimators use identical data. Truth is reserved for evaluation. CSV exports contain all 1,201 states, 22 columns including the estimate, velocity, covariance, errors, and packet counts.

| Seed 42 / 3D position RMSE | Gated EKF | Ungated EKF | Inertial only |
| --- | ---: | ---: | ---: |
| Survey | 0.161 m | 0.162 m | 22.939 m |
| Acoustic blackout | 0.167 m | 0.159 m | 22.939 m |
| Multipath | 0.183 m | 1.643 m | 22.939 m |
| Cross-current | 0.161 m | 0.161 m | 22.939 m |

Multipath gating reduces RMSE by 8.95× for this seeded mission. The outage removes acoustic ranges from 40–70 s while velocity and depth observations remain available. Gating is not universally better: the ungated filter has slightly lower RMSE in this blackout run. Multipath adds +10 m to selected ranges from 35–75 s. Current adds 0.008 m/s² northward acceleration from 40–80 s, observed by the inertial sensor.

## UI tools and presentation

Three.js 0.186.1 supplies WebGL rendering and OrbitControls; uPlot 1.6.32 supplies linked time-series charts; Motion 14.0.0 mini supplies entry and scenario transitions. Dependencies are pinned in work/kalman-showcase-tools/package-lock.json, bundled into kalman/vendor.js, and served locally with their licenses. No remote requests are required to run the project. Build tooling uses esbuild 0.28.2.

The page uses a green/teal palette related to the portfolio, a restrained editorial layout, a procedural AUV/seabed, mission telemetry, three camera presets, orbit/zoom, layer toggles, replay and scrubbing, fullscreen, and data export. Reduced-motion preferences suppress transitions and camera easing. WebGL failure preserves telemetry, plots, and export. Without JavaScript, controls remain disabled and the engineering specification is readable.

## Validation

44/44 Node tests passed: exact prediction/correction fixtures; finite-difference acoustic Jacobians; deterministic data and absence of truth leakage; precise sensor timing/outage; positive-definite full covariance at every step of all four missions; covariance eigensystem reconstruction; independently calculated RMSE and seeded multipath improvement; project integration; upload and existing-site regressions.

Headless Edge/Chromium with software WebGL verified all four scenarios, stable idle time, play/pause, restart, keyboard scrubbing, mission completion, all camera presets, layers, fullscreen entry/exit, chart inspection near 60 s, and a 1,201-row / 22-column CSV export. Tested widths 1440, 1280, 768, 390, and 320 px fit without horizontal overflow. Normal operation made no external requests or console errors. Reduced-motion, no-JavaScript, and no-WebGL contexts passed their checks. Final desktop/mobile screenshots were visually reviewed after the small-label refinements.

Evidence: work/kalman-showcase-tools/verification.json and screenshots/. Browser harness: work/kalman-showcase-tools/verify-ui.cjs. Numerical checks: tests/kalman.test.cjs. Project structure checks: tests/kalman-integration.test.cjs. Tool-selection research: work/kalman-showcase-tools/RESEARCH.md.

## Model limits

This is a synthetic portfolio simulation, not deployed AUV telemetry or a vehicle controller. Known attitude is assumed; orientation and biases are not estimated. Simulated global-frame inertial acceleration has σ = 0.025 m/s² plus fixed bias [0.006, -0.004, 0.0015] m/s². Acoustic σ = 0.5 m, pressure σ = 0.08 m, and Doppler σ = 0.045 m/s. Beacon positions are known, noise streams are independent, and latency is omitted. Assumed continuous process spectral density is q = 0.02 m²/s³. Confidence is model-based, not an empirical safety guarantee.

Validation does not establish Safari/Firefox compatibility, physical-device performance, or screen-reader coverage. No changes have been committed, pushed, or published for this goal. The previous delivery report is preserved at work/kalman-showcase-tools/PREVIOUS_DELIVERY.md.
