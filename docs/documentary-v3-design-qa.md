# Documentary preview — design and playback QA

## Evidence

- Local compiled app: http://127.0.0.1:3000/.
- Final capture: C:/Users/mateo/.codex/visualizations/2026/11/16/01a1e54d-a04c-7bc3-aa67-2976ee8b84e7/price-journey-documentary.jpg
- Capture: 1440 × 1024 CSS viewport, 1425 × 1013 raster; prologue playing at approximately six seconds, voice and subtitles on. Screenshot shows the supplied portrait, narrative hierarchy, subtitle and playback transport.
- Mobile portrait and captions inspected at 390 × 844; document width did not exceed viewport width. Temporary viewport override reset.
- User-approved v2 visual hierarchy retained and extended with a dedicated portrait composition, source photographs and the documentary transport. Prior evidence/history retained in docs/immersive-v2-design-qa.md.

## Verified in Chrome

- Watch the documentary starts local MP3 narration and automatic camera progression.
- Observed automatic transitions from portrait to Swiss landscape, village detail and Arctic reconstruction with corresponding audio sources changing. Narration was not tested as one uninterrupted ten-scene recording; scene controls and the ending were exercised separately.
- Audio DOM showed advancing currentTime, paused=false and expected local clip. Captions changed by sentence alongside playback.
- Pause/resume retained the same position (village passage at approximately 14.4 s). Opening a photograph paused its audio.
- Manual scene selection switched clips; there is one HTML audio element, so old/new narration cannot overlap.
- Final scene ended with paused=true, ended=true and Watch again. The final build's Watch again restarted scene 1 and price.mp3 at zero.
- Voice off paused the narrator independently; subtitles off/on and master mute controls worked.
- Historical image viewer displayed the supplied filename, Swiss fieldwork dates, Figure 1 reference and source link, distinct from the generated-image disclosure.
- Mobile portrait, text, caption and transport were legible without horizontal page overflow. No real touch-device or Safari test is claimed.
- Final screen restored to the hero with sound off. Compiled local server left running on port 3000; temporary port 3001 and development server stopped.

## Fixes during validation

- P1: Automatic transitions must use the audio ended state and wall time, not a frame-capped timer that slows under browser throttling. Updated the progression and verified automatic transitions in the compiled presentation.
- P1: Replay from the final scene must reset the scene reference before automatic progression restarts. Fixed and verified Watch again returns to portrait/audio zero.
- P2: Historical photos have different proportions from generated studies. Camera calculations now accept their native aspect ratio. Tests cover both dimensions.
- P2: Sentence boundaries from synthesis slightly overlapped. Normalized cue ends to the next cue start; validated ordering and duration bounds.
- P2: Generation initially returned no audio for the Andrew multilingual voice. Delivered assets use en-GB-RyanNeural at -12% rate.

## Code checks

Production build and TypeScript passed. Scoped ESLint passed. Five Node tests passed: camera coverage, backward beat selection, native historical image proportions, ten audio/transcript asset pairs, and ordered subtitle intervals.

Development console contained the existing browser-extension hydration warning (bis_skin_checked/bis_register). No new app exception appeared in the exercised compiled flow. Subjective voice/mix quality through speakers was not evaluated; browser playback, cue timing and music-ducking implementation were checked.

## Scope and remaining polish

- Ten local MP3s total about 1.34 MB; approximately four minutes including transitions.
- Supplied portrait plus two source-matched book images and three disclosed AI reconstructions. No invented historical quotes, dates, identifiers or health statistics.
- Narrator is synthetic and contemporary. Production narration, catalog/rights approval and community/editorial review remain future work.
- P3: Navigation dots cross the upper portrait area on a narrow screen; controls and text remain readable. Enlarged historical JPEGs soften at deep zoom.
- Music-only automatic playback and forced network failures were not separately exercised end to end.

final result: passed (local demonstration scope)
