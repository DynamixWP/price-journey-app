# Design QA — within the photograph, v5

Status: passed for local presentation. 16 November 2026.

## Scope

Same-image camera zoom and narration for four documentary details, resumable voice controls, subtle camera motion, full-viewport photograph exploration, and an expanded atlas with eight historical image assets across six destinations. Switzerland and New Zealand remain the main documentary chapters; the Arctic concepts remain separate.

## Observed in Chrome

- Desktop viewport and 390 × 844 mobile viewport tested; override reset afterward.
- The church hotspot opens an inline photographic detail without a dialog. The main narration paused at 7.036908 seconds and remained at that exact time while the detail played.
- Detail narration paused at 3.876805 seconds and continued to 8.397569 seconds after Resume voice. Main narration remained paused at 7.036908 seconds throughout.
- Resume documentary restored automatic playback from the saved time, then advanced to 11.65814 seconds in the same Swiss church clip. It did not restart. Explicit replay remains separate.
- Returning preserves an already-paused documentary state, with the return button labelled accordingly.
- Mobile detail source text, subtitles, alternate-detail controls, voice pause/resume and return button stayed inside the photographic scene and remained reachable.
- The full-screen photo explorer displayed both Rarotonga portraits and the Peru photo plate. Switching connected photographs and returning to the globe retained the selected destination.
- The atlas showed eight assets, six destinations and counted photo markers. Orbit visibly moved the globe; its toggle stopped rotation.
- Mobile atlas card and destination rail were initially overlapping. Final CSS verified a card bottom at 639 px and rail top at 648.6 px, leaving a clear gap.
- Final desktop atlas and mobile atlas screenshots captured after the final build. No errors in the checked browser console.
- Browser viewport screenshot scaling required a reset during mobile testing; the reset produced correctly sized captures. The app's inspected viewport remained 390 × 844.
- The local demo was left open at the beginning with sound off, ready for Watch the documentary.

## Checks

- Final production build passed, including TypeScript.
- Six existing Node tests passed during implementation: camera coverage, reverse scene boundaries, native image aspect ratios, narration assets, detail assets and ordered subtitle intervals.

## Evidence

Saved under C:/Users/mateo/.codex/visualizations/2026/11/16/01a1e54d-a04c-7bc3-aa67-2976ee8b84e7:

- price-journey-inline-detail-v5.jpg
- price-journey-expanded-atlas-v5.jpg
- price-journey-mobile-atlas-v5.jpg
- price-journey-mobile-detail-v5.jpg

## Practical limits

Resume is retained while exploring within the current page; it is not a persistent bookmark across reloads or browser sessions. The four narrated hotspots belong to the Swiss and Rotorua photographs. New archive images have source-linked contextual text and galleries, without additional generated narration. Map tiles require network access and WebGL. Positions indicate regions rather than verified camera locations. Narration is synthetic; the ambient score is composed, not historical field audio. Source notes are in docs/connected-documentary.md and docs/expanded-archive-sources.md. Earlier v4 QA is preserved in docs/connected-v4-design-qa.md.
