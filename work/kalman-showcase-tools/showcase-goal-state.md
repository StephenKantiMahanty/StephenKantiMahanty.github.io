# Kalman showcase goal

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
