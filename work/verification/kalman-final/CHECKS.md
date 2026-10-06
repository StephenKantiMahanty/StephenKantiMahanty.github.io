# Final integration checks — 2026-10-05

All commands ran from the final worktree. Node v24.21.0. Browser: connected Edge.

```powershell
node --test tests/*.test.cjs
Get-ChildItem kalman -Filter *.js | ForEach-Object { node --check $_.FullName }
node --check kalman/preview.cjs
git diff --check
node kalman/preview.cjs
```

Results: 37 passed / 0 failed; all syntax checks passed; diff check passed with LF/CRLF notices; preview bound to http://127.0.0.1:8314. Final suite rerun after concise variance speech formatting. Additional trailing-whitespace audit covers untracked/new source files.

The actual UI was exercised with native locator clicks, Enter, range Home/End/PageUp/arrow keys, native select choices and radio choices. Browser evaluations read only DOM/layout state. Test-only VM spies observed actual recorded-data object identity at the numerical API boundary. No rival source or shared infrastructure was modified.

Files:

- `tests.txt`: final full test output, including exact seed-42 scores.
- `journeys.json`: successive DOM readouts for correction, tuning/baseline, zero-q match, dropout growth/return, answer feedback, all scenario endpoints/replay and animation pause.
- `final-viewports.json`: final three fixed frame viewport sizes, page widths, canvas sizes, physical output settings and target heights.
- `layouts.json`: standalone phone layouts and expanded optional teaching content. A 320px playback record was initially named desktop during capture; its actual dimensions are recorded and the label was corrected.
- `physical-values.json`: final concise physical variance speech and silent outputs.
- `keyboard-focus.json`: active R slider, solid computed outline, updated physical value.
- `nojs.json` and `nojs.png`: script-disabled sandbox fallback, disabled controls, expandable static example.
- `invalid-seed.json`: fractional seed matches `:invalid`, current step remains 0.2 seconds.
- `secret-launch.json`: actual fourth-card new-tab destination.
- `console.json`: captured normal-app warning/error log. Only unrelated extension errors; no application errors.
- Desktop/phone PNGs: visually inspected actual renders. Desktop mission uses the exact 1440×900 frame; phone scenes and correction use standalone exact viewport overrides.

Unknown: actual OS reduced-motion switching, screen-reader speech, physical touch, cross-engine/formal WCAG audit, benchmarks. Reduced-motion CSS was inspected. Browser fixture sandbox blocks scripts by design.
