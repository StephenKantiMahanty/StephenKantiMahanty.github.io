# Independent coordinator candidate checks

All three native builder Goals complete: results/build-retry/summary.json. All started at baseline commit 3deee5f45039401fa73f5ce21fab8a24cfd25fb6 with identical brief/rubric/guidance hashes. Candidate deliveries saved.

Independently reran node --test tests/*.test.cjs in each candidate: clarity 28/28, cinematic 30/30, workbench 30/30. Includes original 20 regressions and genuine model fixtures, truth isolation, deterministic replay, dropout, covariance PSD and seed-specific metrics.

Actual Edge browser checks via browser skill:
- Cinematic: native Enter step gives prior 7.021, fix 6.801, gain .610, corrected 6.887 m. End on assumed R then another step gives identical fix and prior, gain .059, corrected 7.008 m. Confirms data preservation and gain response.
- Workbench: To end gives 60 s summary; assumed R End keeps timestamp and raw RMSE .816 while B RMSE changes to .436 and pinned A remains .367. Dropout then scrub End gives 44 fixes, A RMSE .573, B .902, raw .866, clear contact-restored and finite-summary text.
- Clarity: native Compare full mission gives R=1.44 vs5.76, filter RMSE .45 vs .48, identical raw RMSE1.23 and120 fixes, clearly labeled full-mission comparison.
- One fresh common comparison tab at viewport320x740, navigated to each candidate sequentially: document clientWidth=scrollWidth=305 for all; scrollbar accounts for15px. Cinematic canvas300px high. Earlier attempt applied viewport only to foreground workbench tab, so its other-tab widths1013 are not phone evidence. Corrected shared-tab checks above supersede that attempt.
- Saved cinematic desktop-ready render visually inspected: coherent cinematic underwater scene and hierarchy. Other visuals delegated to fresh reviewer.

Builder browser evidence supplies broader scenario/endpoint/reduced-motion-source/no-JS checks; limitations preserved in each DELIVERY.md. Fresh final integration requires new browser and test checks. No performance/user-study measurements inferred.
