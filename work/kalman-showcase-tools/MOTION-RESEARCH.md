# Motion and prose revision

## Requested sources reviewed

- [React community discussion](https://www.reddit.com/r/reactjs/comments/1bc16y2/choosing_a_ui_library_that_makes_everyones_life/): discussion of styled kits versus custom primitives, design tokens and maintenance. Treat anecdotes as opinions, not performance evidence.
- [Untitled UI comparison](https://www.untitledui.com/blog/react-component-libraries): compares React kits and headless primitives. Its component-kit focus does not require rebuilding this static JavaScript project in React.
- [Nina Rao's type-safe library comparison](https://dev.to/ninarao/best-type-safe-ui-component-libraries-for-react-in-2026-f22): considers typed components, theming and unstyled primitives. This project already uses native controls; these benefits do not directly address its missing motion between sections.
- [Masaud Ahmod's motion/UI survey](https://dev.to/masaudahmod/top-8-modern-ui-libraries-motion-engines-every-developer-should-know-part-2-2o84): distinguishes visual libraries, motion engines and UI primitives. The framework-independent motion category fits the existing architecture.
- [Magic UI animation survey](https://magicui.design/blog/animation-libraries): presents staggered animation, interaction feedback and animation-library options. Use its discussion as inspiration; avoid adopting promotional performance and accessibility claims as measured facts.

## Implementation decision and primary sources

Use the pinned, locally bundled Motion mini already present in the project. [Official animate documentation](https://motion.dev/docs/animate) confirms DOM keyframe animation, timing and playback controls. [Official inView documentation](https://motion.dev/docs/inview) describes viewport-triggered animation using IntersectionObserver; this implementation uses the native observer directly, avoiding a vendor rebuild. [Official scroll documentation](https://motion.dev/docs/scroll) describes scroll-driven effects; here a small passive, RAF-coalesced scroll handler updates a progress bar and current section. The browser retains its native smooth scrolling and wheel/touch behavior.

One easing curve coordinates hero and section entrances, staggered architecture/cards, scenario indicator movement, scene/telemetry/chart fades and disclosure expansion. Vehicle drawing interpolates between computed samples; numerical results remain exact. Camera easing uses elapsed time, and offscreen/hidden scenes skip rendering. No new library or remote runtime request is introduced.

React UI kits are not installed because this revision needs animation of existing components, not new form primitives. View transitions were also considered via the [MDN API reference](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API); explicit small-element animation is sufficient and keeps chart/canvas interactions available during scenario changes.

## Writing references and adaptation

Read all three files in C:/Users/steph/Documents/Writing Samples: WritingSample1.txt, WritingSample2.txt, and Essay 3.docx (paragraph text extracted from OOXML). The first two are conversational explanations that establish a situation, connect causes and consequences, and describe what the author would do. The essay develops its comparisons through context, evidence, reasoning and consequence, with occasional restrained humor.

The new page uses first-person motivation and decisions, concrete sensor examples, and connected explanations such as “The beacons report distance, while the filter estimates coordinates. So I linearize…” It adapts the cadence to short web paragraphs and preserves the numerical assumptions and simulation label. The political subjects, quotations and private source documents are not copied into public assets; no new biography or hardware deployment claim is added.
