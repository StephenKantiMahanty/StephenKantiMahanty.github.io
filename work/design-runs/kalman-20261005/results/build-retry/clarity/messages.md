I’ll read the goal and project instructions, then build and verify the activity in this working copy.

---

[Orchestrator - Astra]
The goal calls for a complete, seeded Kalman lab with four scenarios, independent noise controls, replay comparisons, guided teaching, and a fourth Secret project card. I’ll build it as an underwater expedition notebook, then verify the filter numerically, run the site regressions, and check the required browser sizes.

[Builder - 5.6-Luna]
I’m starting with the simulation core so the live scene, worked examples, and comparisons all use the same tested model.

---

The live mission and notebook are implemented. Sensor data is generated separately from filter tuning, so changing Q or R preserves the truth and measurement stream. The current and bias missions deliberately violate the filter’s assumptions, giving learners a way to see why confidence can differ from actual error.

---

The first numerical pass is green: 28 tests pass, including the exact filter fixture, dropout prediction, deterministic replay, tuning-independent measurements, and 30,000 covariance updates. On seed 42, nominal filter RMSE is 0.45 m versus 1.23 m for raw fixes; the biased mission’s truth lies inside the confidence band for only 33% of steps.

I’m using the Browser skill to check the layout and learner journeys next.

---

[Checker - 6.1-Sol]
Cycle 1 score: 8/10. The numerical and site regression checks pass, and the desktop and 390 px layouts have no horizontal overflow. Browser checks found two usability fixes: playback controls sit too far down the page, and stepping from the launch state leaves the play button labeled “Start mission.”

[Orchestrator - Astra]
For cycle 2, I’ll move playback above the scene, fix its label after stepping, and verify the endpoint, dropout recovery, keyboard tuning, and 320 px layout.

---

[Builder - 5.6-Luna]
Playback controls now appear above the scene, and stepping updates the play button to “Continue.” I also corrected the depth-axis labels to preserve fractional tick values. The next browser pass will check dropout growth and recovery, replay, comparison, and the finite mission summary.

---

The 320 px audit shows no horizontal overflow, and all mission buttons are 44 px tall. The dropout mission reaches 60 seconds, disables stepping, reports 84 received fixes, and produces a comparison using the same raw data. I’m now checking the band during the blackout, keyboard tuning, and the remaining scenario journeys.

---

During dropout, the browser showed no fix and a modeled ±2σ interval widened to 5.54 m. Keyboard changes to assumed R and Q preserved the first fix at 3.69 m; increasing actual sensor noise changed it to 2.64 m. The bias mission ended with 1.90 m of actual error despite a ±2σ interval of only 0.98 m.

---

[Checker - 6.1-Sol]
Cycle 2 score: 9/10. The required implementation checks pass: numerical fixtures and regressions, all four scenario journeys, replay and comparison, finite summaries, keyboard controls, no-JS fallback, and responsive audits at 1440×900, 390×844, and 320×740. No required fixes remain.

I’m finishing the delivery notes with setup commands, evidence, and verification limits. Changes remain local and uncommitted.

---

Implemented and verified: 28 tests pass; browser checks completed at all three required sizes. Review score: 9/10 after two cycles. Changes are local and uncommitted; verification limits are documented.

## 🏆 FINAL PRODUCTION OUTPUT

[Open Abyss](http://localhost:8311/kalman/) · [Delivery notes](C:/Users/steph/Documents/StephenKantiMahanty.github.io/work/design-runs/kalman-20261005/worktrees/clarity/DELIVERY.md)

![Desktop preview](C:/Users/steph/Documents/StephenKantiMahanty.github.io/work/design-runs/kalman-20261005/worktrees/clarity/work/verification/kalman-desktop.png)
