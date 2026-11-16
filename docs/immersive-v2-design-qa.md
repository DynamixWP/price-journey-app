# Immersive photographic journey v2 — design QA

## Target and evidence

User requested a more immersive evolution: scroll into details, story and music, plus a Hiroshima/Nagasaki-inspired spatial mode. V1 history is preserved in docs/photographic-v1-design-qa.md.

- Live implementation: http://127.0.0.1:3000/
- Evidence folder: C:/Users/mateo/.codex/visualizations/2026/11/16/01a1e54d-a04c-7bc3-aa67-2976ee8b84e7/
- Desktop story: price-journey-scroll-v2.jpg, scene 3, sound off, motion on, settled camera. CSS viewport 1440 × 1024; raster 1425 × 1013.
- Desktop globe: price-journey-globe-v2.jpg, same viewport, satellite layer, no region selected.
- Mobile: price-journey-mobile-v2.jpg, scene 3, CSS viewport 390 × 844. Additional mobile globe/card screenshots inspected in tool output.
- V1 screenshot and revised desktop scene were displayed together at equal raster dimensions. This is an intentional interaction/layout extension, not a pixel-identical clone. Serif/italic hierarchy, monochrome imagery, ivory and muted green palette remain consistent. Static chapters become a cinematic stage.

## Findings resolved

- P1: MapLibre 5.24 threw on raster requests aborted during layer change/unmount. Upgraded to 6.18 with a local version-matched worker. Re-tested satellite → atlas → satellite → photograph, reopening, and mobile map-to-photo without an app exception.
- P2: Scene selection landed halfway through camera motion, cropping the figures. Seek now lands after transition. Desktop/mobile captures show both figures.
- P2: Mobile globe intro, pins, controls and attribution overlapped. Reduced globe scale, shortened intro, moved navigation controls and separated the photo rail/disclosure/attribution. Fresh mobile selected-region capture verified separation.
- P2: Whole world now explicitly resets position, scale and padding after free exploration. Zoom/reset exercised in Chrome.
- P2: /concept redirects home. Replaced the photographic page's loop-back link with a working globe button; existing route left untouched.

## Functional verification

- Desktop and mobile: sound entry, native scroll camera movement, scene jumps, image transitions and narrative states.
- Automatic journey starts; Page Down pauses it. Manual scene selection and modal suspension are implemented.
- Sound and motion toggles. With motion off, visible camera DOM transform is scale(1), with narrative still navigable. System reduced-motion handling was code-reviewed, not separately tested by changing OS preferences.
- Satellite and atlas layers render; regional flight/card, photo entry and repeated map opening work. Mobile Canadian Arctic card and viewer inspected.
- Mobile document width equals viewport width (390), with no horizontal overflow. Temporary viewport override reset.
- Console after map fix: no app-origin exception in tested flow. Existing extension-injected bis_skin_checked/bis_register attributes cause a hydration warning. No suppression added.

## Code checks

- Production build passed after camera/map/mobile changes, generating all eight route outputs.
- TypeScript and scoped ESLint passed for experience modules and worker setup.
- Two Node tests passed: camera coverage in portrait/landscape without exposed edges, and backward narrative beat selection.
- Final footer navigation adjustment checked in Chrome and type/lint checked afterward.

## Limits

- P3: Enlarged 1536 px study images soften fine details. Production originals need high-resolution tiled deep zoom.
- Audio controls/scene logic verified; subjective speaker output not evaluated. Synthesized sound, no field recordings or voiceover.
- Images, text and map placements are disclosed concepts, not verified archival records. No video/360 media in this slice.
- Map retry/photo fallback exists; network failure was not simulated end to end.
- No cross-browser, real touch-device, production content approval or deployment claim.

final result: passed (local prototype scope)
