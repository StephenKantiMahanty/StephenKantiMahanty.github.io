# UI tool research / ABYSS

Reviewed official documentation and maintained source repositories for the project redesign.

## Three.js / OrbitControls
Sources: https://threejs.org/docs/ and https://github.com/mrdoob/three.js/blob/r186/examples/jsm/controls/OrbitControls.js
Selected for procedural WebGL geometry, camera controls, physical scene coordinates, lighting, and reusable geometry. The renderer uses local assets, capped pixel ratio, disposable trajectory geometry, camera presets, and a fallback for unavailable WebGL. The scene displays computed estimates and an ellipsoid derived from covariance; it does not generate numerical results.

## uPlot
Source: https://github.com/leeoniya/uPlot
Selected for dense time-series traces with cursor hooks and independent scales, without adopting a full application framework. Charts reuse precomputed arrays; hovering selects the corresponding mission sample. Programmatic cursor updates do not trigger replay changes. Resize observers handle layout changes.

## Motion mini
Source: https://motion.dev/docs/animate
Selected for small native-browser animation support. Only opacity and transform entry transitions are animated; page content does not depend on animation to appear. Reduced-motion preferences skip those transitions. Camera motion is handled by the 3D renderer rather than adding a paid animation integration.

## Delivery choice
Pinned three 0.186.1, uplot 1.6.32, motion 14.0.0, and esbuild 0.28.2 after inspecting installed versions. Libraries are bundled locally so CDN availability does not affect the project. The bundle is about 825 kB before transport compression. Tree-shaking the export surface remains possible if performance profiling calls for further reduction; the current implementation passes local interaction checks.

## Project scope
A showcase should communicate ownership, architecture, and measured results first. Accordingly, the page replaces teaching exercises with a mission viewport, live diagnostics, scenario benchmarks, source access, and concise engineering decisions. It labels all results as simulation evidence and records the estimator's assumptions.

The public reference links to Welch and Bishop's original SIGGRAPH 2001 course pack, hosted by Temple University: https://cis.temple.edu/~latecki/Courses/CIS750-03/Papers/KalmanFilterSIGGRAPH2001.pdf. Verified accessible as an 80-page PDF; the former UNC PDF address returned 404.
