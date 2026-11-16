# Design QA — narrated atlas, v6

Status: passed for local presentation. 16 November 2026.

## Experience

Eight historical atlas image assets now have eleven interactive narrated points. Seven new local clips cover the Peru photo plate and five Pacific portraits. The photo explorer retains one session while photographs change; the ambient score belongs to the parent experience. A guided route advances between points and photographs, and stops at the last passage. Manual previous/next and thumbnails preserve the voice's paused state and each unfinished detail's timestamp. A header control returns directly to the documentary.

## Observed checks

- Initial desktop checks ran in Chrome. Its extension then required an update, so final playback and mobile checks used the in-app browser, without changing Chrome settings.
- The main Swiss landscape narration was held at 1.730885 seconds throughout the photo excursion. Returning directly to the documentary restored automatic mode and continued to 7.880621 seconds in the same clip.
- The guided sequence advanced from the lower Peru masonry detail through the first Rarotonga portrait and into the second, whose voice was observed playing at 2.539539 seconds. Main audio remained paused at 1.730885 seconds.
- Paused the second Rarotonga voice at 8.699507 seconds, advanced to the North Island portrait, and confirmed its voice stayed paused. Returning to Rarotonga restored 8.699507 seconds after media metadata loaded.
- The New Caledonia passage reached its end and displayed Journey complete / play again. No automatic wrap to the beginning.
- The first zoom review exposed programmatic vertical scrolling inside the full-screen photo viewport. Clipping the decorative image layer and viewport fixed it: scrollTop remained 0 and the header stayed at top 0 while zoomed.
- Mobile layout checked at 390 × 844: portrait hotspot, source disclosure, voice controls, direct documentary return, guided controls and horizontal filmstrip remained reachable. The active thumbnail now centres on image changes.
- New images crossfade and retain their native aspect ratio. Portrait and plate hotspot coordinates refer to the actual image, including in mobile layouts. Reduced-motion settings disable camera animation.

## Automated checks

Final production build, including TypeScript, passed. Nine tests passed covering every atlas image's narrated point, matching transcripts and local MP3s, ordered subtitles, the collection sequence and its stopping condition, portrait/plate focus geometry, documentary camera coverage and scene boundaries.

## Sources and limitations

Narration is contemporary synthetic demo audio. Sources and scripts are documented in docs/atlas-narration-sources.md and docs/expanded-archive-sources.md. These are regional geographic references; no exact camera locations, missing identities or exposure dates were invented. Main-story and detail bookmarks last for the current page session, not across reloads. Map tiles need network access and WebGL. Final historical cataloguing and publication rights remain for archive review.

The prior verification record is preserved in docs/within-photograph-v5-design-qa.md.

## Evidence capture

Desktop and mobile screenshots were inspected during browser QA. Exporting a screenshot through a data URL was rejected by the browser URL policy; that export was stopped. No v6 screenshot files are included in the repository. The live local preview remains available.
