# Kalman typography revision

The old page combined a very large compressed sans headline, italic serif accents, spaced uppercase micro-labels, repeated numbered section banners, and matching small text columns. This combination made the project resemble a generic promotional template. The revision changes those visible choices rather than treating “AI-generated” as something a font detector can measure.

## Online references and applied decisions

[USWDS typography guidance](https://designsystem.digital.gov/components/typography/) recommends comfortable body text, left alignment, controlled line length and restrained use of uppercase/italic text. Main reading paragraphs and expanded specifications now use 16 px or larger text, with roughly 65–70-character maximum measures and a 1.6 line height. Short UI labels and data tables use smaller sizes where needed. Most labels are sentence case.

[Practical Typography on headings](https://practicaltypography.com/headings.html) recommends fewer heading treatments, subtle emphasis and spacing that connects headings to their content. The page now uses direct section names, moderate semibold headings, normal letter spacing, and no forced line breaks or italic display words in the title. Repeated numbered banners are removed. Engineering notes are arranged as prose beside short topic headings, stacking naturally on mobile.

[IBM's official Plex repository](https://github.com/IBM/plex) documents the typeface's UI purpose and open licensing. IBM Plex Sans regular and semibold replace the mixed display-font treatment; fixed-width text is retained for selected numerical/code-like readouts. Fonts are local WOFF2 files, with no external font-service request. Chart axes use the same family after font readiness.

## Font provenance

Source commit: 763c36ef9117782905ae010056dfbe8fd2653a25 in IBM/plex. Exact asset URLs, sizes and SHA-256 hashes are recorded in kalman/fonts/SOURCE.json. The original SIL Open Font License is included in kalman/fonts/license.txt. Regular: 63,020 bytes; semibold: 67,060 bytes. Original files are copied without modifications.

## Review evidence

type-verification.json checks both actual font faces are loaded, ordinary headline tracking, readable paragraph/specification sizes and viewport/descendant fit at 320, 390, 768, 1280 and 1440 px. Fresh images in type-screenshots/ show the changed title, mission, results and architecture. Screenshot review led to removing the numbered scenario prefixes and separating metric labels, then recapturing all widths.

The filter, seeded results, motion and export paths remain intact. These changes express a less promotional, more straightforward engineering-project presentation; they do not establish a universal human/AI visual distinction.
