# Design QA — connected documentary, v4

Status: passed for local presentation. 16 November 2026.

## Scope

Eight historical scenes with the supplied portrait and photographs from Lötschental and Rotorua. Four spoken, sourced photo details. Full-viewport atlas with two destinations, satellite/cartographic layers and a documentary return control. Arctic AI studies live in a distinct concept gallery.

## Observed in Chrome

- Desktop default viewport and 390 × 844 mobile override; override reset after testing.
- The atlas occupies the viewport as a section, outside the native photo dialog. The underlying story is inert while it is open.
- Verified automatic Swiss playback paused at 5.216559 seconds on opening the atlas. Explored Switzerland, opened the church detail, travelled to Rotorua and opened the people detail. Main audio stayed at 5.216559 throughout; on return it continued at 5.219826 with automatic mode retained.
- Detail audio played independently while documentary audio was paused. Photo detail zoom reported 165%, and switching details selected the corresponding text and local MP3.
- Silent automatic playback retained the same scene and scroll offset on return: 2720.800048828125 before and immediately after the excursion, then continued forward. The bookmark names the saved scene without implying an audio timestamp for silent mode.
- A manual, sound-off exploration returned without turning on narration or automatic playback.
- Both photo cards and geographic markers open the correct historical asset. Rotorua is labelled city-level and Lötschental valley-level; exact camera positions are not claimed.
- Satellite → Atlas → Satellite and Whole world controls worked. No errors in the checked browser console.
- Mobile atlas keeps return, map controls, photograph card and both destinations reachable. Small-screen story hotspot labels are suppressed so they cannot overflow; accessible names remain.
- The prologue no longer exposes the hidden, unused photograph hotspot.
- Documentary left open at its beginning, with sound off, ready for Watch the documentary.

## Checks

- Production build and TypeScript passed after the final edits.
- Six Node tests passed: camera coverage, reverse scene boundaries, native image aspect ratios, narration assets, detail assets and ordered subtitle intervals.

## Evidence

Saved under C:/Users/mateo/.codex/visualizations/2026/11/16/01a1e54d-a04c-7bc3-aa67-2976ee8b84e7:
- price-journey-connected-atlas.jpg
- price-journey-connected-story.jpg
- price-journey-connected-mobile.jpg

## Practical limits

This remains a local presentation prototype. Map tiles require network access and WebGL. The photographs and audio are local assets. Geography is approximate at city/valley scale. Historical catalog details, image rights and a final editorial review remain for publication. Narration is synthetic; ambient sound is composed, not a historical field recording. Source notes are in docs/connected-documentary.md.
