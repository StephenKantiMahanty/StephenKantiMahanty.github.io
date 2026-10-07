# Kalman typography goal

Active objective: make the font and text formatting feel less AI-generated, using online resources. Scope: current Kalman page.
Previous goal turn: complete; its motion implementation and checks are preserved below. Current turn: progress (current page inspected; typography references researched; fonts downloaded and new type/formatting implemented).
Completed cycles: 1 of at most 3. Orchestrator, Builder and Checker complete. Score: 9.1/10. All mandatory requirements verified in work/kalman-showcase-tools/TYPE-AUDIT.md.

Acceptance criteria:
1. Read authoritative online typography guidance and apply concrete decisions; retain source/license evidence for any new font.
2. Visibly change the font, heading treatment and text layout: remove giant squeezed headings, decorative serif italics, repetitive tiny caps/numbered banners and uniform text cards.
3. Keep a personal engineering-project voice, concrete topic headings and readable paragraphs/technical labels.
4. Verify actual fonts render locally, mobile/desktop layouts and expanded details remain readable, and existing interactions/motion/numerical behavior still pass.
5. Inspect final screenshots and record evidence/limitations; no publishing or commit requested.

Current changes: typography.css; local IBM Plex Sans regular/semibold WOFF2 and license/provenance; index labels/headings; chart fonts; initialization waits for font readiness. Numerical core and motion implementation retained.
Preview revalidated HTTP 200 on port 8337. Sandbox setup remains unavailable; escalated tools work. Final type-verification.json confirms both fonts loaded, no overflow at five widths, normal headline tracking and 16 px prose/specifications. Full expanded model text and final desktop/mobile screenshots visually reviewed. Full interaction and focused motion browser suites passed; final 44/44 Node tests, JavaScript syntax and git diff --check passed. Objective achieved; no required work remains. Changes local and unpublished. Physical-device/cross-engine/screen-reader limits remain unverified.

## Archived completed motion goal

Active objective: improve animation and smoothness of the Kalman website, especially between parts; review all five supplied sources; tailor prose using all three writing samples.
Current turn classification: progress (implementation and final verification completed). Initial interrupted turn made no implementation progress. Completed cycles: 1 of at most 3. Orchestrator, Builder and Checker complete. Score: 9.2/10; all mandatory requirements verified. Completion audit: work/kalman-showcase-tools/MOTION-AUDIT.md.

Mandatory acceptance criteria:
1. Read the Reddit, Untitled UI, both DEV, and Magic UI links, verifying chosen motion APIs against primary documentation. Evidence: work/kalman-showcase-tools/MOTION-RESEARCH.md.
2. Improve section transitions, anchor navigation and orientation through viewport entrances, staggered content, sticky navigation, current section and reading progress. Verify rendered desktop/mobile journeys.
3. Improve scenario/replay transitions with a moving selection indicator, coordinated scene/telemetry/chart fades, elapsed-time camera easing and vehicle drawing interpolation between exact samples. Verify intermediate frames and endpoints.
4. Rewrite prose using WritingSample1.txt, WritingSample2.txt and Essay 3.docx. Inspect visible copy against the references; preserve simulation/numerical facts and avoid unsupported personal claims.
5. Preserve replay, scrub, charts, layers, fullscreen, export, responsive layouts and no-JS/no-WebGL operation. Final 44/44 tests pass. Fresh verification.json browser journeys pass with no console errors, external requests or overflow at all five widths.
6. Respect reduced motion initially and when the preference changes. Rapid repeated clicks, disclosure keyboard actions, and anchor targets settle correctly. Focused motion-verification.json checks pass, including direct section-entrance observation and cancelling active animations on preference change.
7. Record an explicit requirement-level completion audit with meaningful limitations. No publishing or commit requested.

Current files: kalman/{index.html,styles.css,app.js,motion.js,scene.js}. Estimator unchanged. Research: MOTION-RESEARCH.md. New harness: verify-motion.cjs. Previous showcase state preserved in showcase-goal-state.md.
Process evidence: sandbox command startup fails with setup refresh errors; escalated commands work. Old preview was confirmed unreachable, then restarted as live session 12389, port 8337. Initial browser verification failed during initialization, not counted as pass. Focused harness diagnosed initial setIndex with empty rows; guard fixed. Fresh full and focused browser suites passed. JavaScript syntax and git diff --check passed. Desktop/mobile screenshots visually reviewed. Objective achieved; no required work remains. Not published or committed. Physical-device performance, Safari/Firefox and screen-reader coverage remain unverified.

## Archived completed showcase record

Active objective: remove lab/teaching portions; create a polished project showcase using researched UI tools; expand the filter and presentation for a strong engineering portfolio.
Previous goal record belonged to a completed writing/theme revision. This is a new goal.
Latest goal turn classification: complete (mandatory criteria verified; final audit recorded).

Completed review cycles: 1 of 3. Builder and Checker completed. Latest score: 9.2/10. All mandatory criteria verified; no further revision cycle needed.
Acceptance criteria:
1. No lab, quiz, lesson, teaching flow in production page or Secret project card.
2. Showcase presents ownership, system architecture, source, reproducible results, and model limits.
3. Researched UI tools actually integrated: local Three.js/OrbitControls, uPlot, Motion.
4. Substantive filter expansion: six states, 3D motion, nonlinear acoustic ranges, asynchronous pressure/Doppler/inertial inputs, innovation gating, full covariance.
5. Interactive presentation: camera presets/orbit, replay/scrub/rate, layers, charts, fullscreen, CSV export.
6. Responsive and resilient: 320–1440 widths, reduced motion, no-JavaScript, no-WebGL.
7. Numerical fixtures and existing-site regressions pass; screenshots visually reviewed; no invented hardware or hiring guarantees.

Evidence obtained: final 44/44 Node tests; native headless Edge/Chromium WebGL verification (work/kalman-showcase-tools/verification.json), layouts at 1440/1280/768/390/320; interactions, fullscreen entry/exit, CSV, no-JS/no-WebGL/reduced-motion passed; no external requests or normal console errors. Fresh desktop/mobile screenshots reviewed after label-size improvements. Broken external paper link replaced with verified original course pack. Completion audit: work/kalman-showcase-tools/AUDIT.md. git diff --check passed.

Files: kalman/{index.html,styles.css,app.js,navigation.js,scene.js,charts.js,vendor.js,vendor.css,icon.svg}; Secret card; tests; README; DELIVERY; research and pinned build tooling under work/kalman-showcase-tools.
Old two-state model and tuning helpers removed; numerical tests replaced with six-state tests.
Local preview confirmed session 46399, port 8337. Objective achieved; ready for goal completion. No deployment or commit requested. Limits: Safari/Firefox, physical-device performance, and screen-reader coverage unverified.

Upload follow-up: live site already has file labels and safe JSON response handling. Live code-file upload/download/privacy/delete verification passed; temporary file deleted. No tracked gitlinks remain, and publishing fix is committed as 39bcdc9. Verification script: work/verification/upload-live.cjs.
