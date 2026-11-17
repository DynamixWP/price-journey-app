# Alpine place exploration

Branch: `feature/alpine-place-exploration`. This version supersedes the automatic arrival described in [the first scene notes](generated-alpine-scene.md).

## Interaction

Five connected places: overlook, village lane, church interior, timber house interior and stream path. Portal clicks move the camera toward a doorway or path before crossfading into the next environment. Dragging pans the image; scroll, the distance slider and Step closer control the approach. Arrow keys / WASD work when the scene itself has focus. Each interior has an exit. The Places strip provides an accessible alternative to image hotspots, especially on narrow screens. Detail zooms remain within the scene.

This is a photographic exploration with connected viewpoints and camera animation, not a freely navigable 3D model. The generated images are not panoramas; panning is bounded to avoid exposing image edges. All interiors, paths and spatial relationships are explicitly imagined, not historical reconstructions with verified plans.

## Sound

Entry, portal navigation and detail selection never start a voice. Listen to description explicitly starts the local recording for the current place; Pause and Resume preserve its time. Changing place stops narration. Returning to a place restores the saved time without playing automatically. Read opens the same script without sound.

Ambience has a separate opt-in toggle and starts off. It uses local Web Audio synthesis: wind-like noise outdoors, water by the stream, quieter filtered room tones indoors, a restrained harmonic background, and brief generated footstep sounds when entering or stepping closer. There are no claimed field recordings. Ambience continues over the globe/photo overlay and pauses when leaving exploration or hiding the tab. The documentary score is suspended during exploration; its prior enabled setting resumes when returning. Descriptions work with ambience off and lower ambience when it is on.

Place, camera, detail and audio position remain in the mounted exploration while the globe or original photograph is open. Session state is not persisted across a browser reload. The original photograph opens without automatically selecting or narrating a detail.

## Generated assets

Used the built-in image_gen tool, with the existing valley and village plates as reference images for lighting and architecture. Each new image was generated separately and copied into the project. WebP conversion uses Sharp at quality 87; PNG masters are retained.

Saved under `public/cinematic/alpine/places/`:

- `village-lane.png` and `village-lane.webp`
- `chapel-interior.png` and `chapel-interior.webp`
- `chalet-interior.png` and `chalet-interior.webp`
- `stream-path.png` and `stream-path.webp`

Optional voice: five `public/narration/explore-*.mp3` files, generated through the project's existing Edge TTS script with en-GB-RyanNeural. Scripts and sentence cues are in `lib/experience/exploration-script.json` and `exploration-manifest.json`.

## Final prompts

Validation: production build and targeted ESLint pass; 15 automated tests pass. Browser checks covered desktop 1280 × 800 and mobile 390 × 844, silent entry and place changes, optional voice with ambience off, independent ambience, keyboard approach, interior portals, detail zooms, and globe/photo return. A paused home description at 0.269633 seconds and camera approach 0.120 were restored unchanged after the globe round trip.

### village-lane

Use case: historical-scene. Asset type: full-screen photographic environment for an interactive web exploration. Generate ONE opaque wide landscape image 1536x1024. Early-1930s Swiss Alpine village inspired by Valais, explicitly an imagined artistic reconstruction, not an archival record or exact reconstruction. The reference images provide architecture and lighting continuity only. Muted olive greens, warm timber, slate stone, ivory plaster, subtle analog photographic grain, exceptionally natural material texture, cinematic but quiet. Eye-level first-person camera, 28mm wide lens, convincing space to move into. No people, text, signage, watermark, modern objects, artificial UI, collage or fisheye. Scene: standing on a gently rising narrow stone-and-dirt lane BETWEEN chalets in the reference village, close to its small ivory plaster church. A modest white church with dark pointed slate spire at center-right, its tall open wooden doorway visible around x65%, y64%; warm dark-timber chalet close on left with a recessed open doorway at x22%,y60%, an inviting interior in shadow. Stone steps and wild grass along walls, distant peaks visible above roofs. Winding path starts bottom center, forks toward the church and chalet; beyond the church a path heads right out into meadows. Strong spatial depth, grounded architecture, side sunlight from upper left. Match the modest scale of the village, no ornate cathedral.

### chapel-interior

Use case: historical-scene. Asset type: full-screen photographic environment for an interactive web exploration. Generate ONE opaque wide landscape image 1536x1024. Early-1930s Swiss Alpine village inspired by Valais, explicitly an imagined artistic reconstruction, not an archival record or exact reconstruction. The reference images provide architecture and lighting continuity only. Muted olive greens, warm timber, slate stone, ivory plaster, subtle analog photographic grain, exceptionally natural material texture, cinematic but quiet. Eye-level first-person camera, 28mm wide lens, convincing space to move into. No people, text, signage, watermark, modern objects, artificial UI, collage or fisheye. Scene: INSIDE the modest village church, viewed from just within the entrance along a worn stone central aisle toward a simple wooden altar at center x52% y55%. Ivory limewashed walls, few small arched side windows, dark wooden pews on either side, simple timber ceiling. Reverent quiet, sunlight beams softly through the left windows illuminating floating dust, restrained old Catholic rural chapel, small carved crucifix above altar, one side candle niche on right around x78% y50%. Natural deep shadows still readable. Human-scale intimate space, no grand cathedral architecture, no elaborate decoration, no readable inscriptions.

### chalet-interior

Use case: historical-scene. Asset type: full-screen photographic environment for an interactive web exploration. Generate ONE opaque wide landscape image 1536x1024. Early-1930s Swiss Alpine village inspired by Valais, explicitly an imagined artistic reconstruction, not an archival record or exact reconstruction. The reference images provide architecture and lighting continuity only. Muted olive greens, warm timber, slate stone, ivory plaster, subtle analog photographic grain, exceptionally natural material texture, cinematic but quiet. Eye-level first-person camera, 28mm wide lens, convincing space to move into. No people, text, signage, watermark, modern objects, artificial UI, collage or fisheye. Scene: INSIDE the timber chalet to the left of the church, an intimate early-20th-century Alpine kitchen and living room. Worn plank floor, dark timber ceiling beams, warm wood-paneled walls, hand-built rectangular wooden table centered slightly right with a plain ceramic bowl, rye loaf and folded linen; black iron stove left, shelves with simple pottery. One open window centered-right at x68%,y40% reveals the same ivory village church spire and green mountains outside. A wooden doorway on far left around x13%,y60% leads back to the sunlit lane. Soft daylight from right window, warm reflected light, tactile imperfect surfaces, museum-documentary photographic realism, no electric appliances. Viewer stands in doorway and can advance toward the table.

### stream-path

Use case: historical-scene. Asset type: full-screen photographic environment for an interactive web exploration. Generate ONE opaque wide landscape image 1536x1024. Early-1930s Swiss Alpine village inspired by Valais, explicitly an imagined artistic reconstruction, not an archival record or exact reconstruction. The reference images provide architecture and lighting continuity only. Muted olive greens, warm timber, slate stone, ivory plaster, subtle analog photographic grain, exceptionally natural material texture, cinematic but quiet. Eye-level first-person camera, 28mm wide lens, convincing space to move into. No people, text, signage, watermark, modern objects, artificial UI, collage or fisheye. Scene: just outside the village on a narrow meadow footpath beside a shallow Alpine mountain stream. Water flows diagonally from center background toward lower-right foreground over irregular stones, thin weathered wooden footbridge across stream in middle distance at x55%,y60%. Footpath runs bottom center toward bridge and winds left toward the tiny timber village and small ivory church far left, with the same grey rocky mountain walls and patches of snow in the background. Small grasses and wildflowers close foreground; conifers on right. Sunlight from upper left, clear water, natural slow-flow river rather than waterfall. Quiet immersive sense of scale, convincing first-person walking destination.


