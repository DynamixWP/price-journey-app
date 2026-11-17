# A house, a world within — desktop exploration v2

The newer [Swiss study](swiss-study.md) adds the photographic presence of Price, archive plates, a reading companion, projection and connected village interactions.

The house is now a compact exploration experience with seven discoveries, easier movement, responsive environmental sound and a functional in-world camera. It remains on `feature/alpine-place-exploration`, separate from the documentary PR.

## Creative grounding

The existing project notes preserve the selected photography-first direction, Joe's brief and prior reference reviews: [photographic-journey.md](photographic-journey.md), [connected-documentary.md](connected-documentary.md). The globe remains a separate full-screen exploration connected to source photographs; this visit preserves that connection and the documentary bookmark.

New research used the official [Gone Home page](https://www.annapurna.com/interactive/gone-home) for object-led discovery and [Everybody's Gone to the Rapture](https://www.thechineseroom.co.uk/games/everybodys-gone-to-the-rapture) for environmental narrative and atmosphere. The supplied [Hiroshima Archive](https://hiroshima.archiving.jp/index_en.html) remains the place/archive reference. These are conceptual influences, not copied scenes or game assets. This turn did not repeat the complete email review or claim a full new playthrough of every supplied website.

## What visitors can do

1. Light or extinguish an oil lamp; its warm point light changes the actual room.
2. Open a window; the casement moves, curtains respond and the outdoor sound becomes more present.
3. Open a drawer and discover a contemporary field-note summary linking the Swiss visits to the original archive and globe.
4. Lift and rotate the camera, then use its viewfinder to compose an image of the real-time scene. Space or the shutter button captures the same centred 3:2 frame displayed on screen.
5. Inspect the bowl and tap the rim for an original synthesized ceramic resonance.
6. Turn the photograph over to see a source label, or return to its original archive record.
7. Save a personal viewpoint in the field notebook. The latest six captured JPEGs can be downloaded by the visitor. These images are labelled as views of a recreation, separate from the historical archive.

The notebook tracks discoveries without requiring a fixed order. Its notes, photographs, room controls, held object, camera position and unfinished narration survive excursions into the globe/archive/documentary within the current mounted page session. They do not survive a reload.

## Controls and accessibility

- Click open floor to walk there. Click an object to approach and examine it. A navigation grid avoids the fixed furniture and opens the entrance door when a route crosses the threshold.
- Drag to look, WASD/arrows to walk, Shift for a faster walking pace, E to interact. Acceleration eases in; releasing movement decelerates quickly. Optional Mouse look captures the pointer until Escape.
- Find a place offers routes to the doorway, table, lamp, window and field notes. Guided travel can pause/resume at the same destination.
- J opens the notebook. H opens help. Escape releases the cursor, returns an object, or opens the pause/settings panel.
- Object rotation and actions also have labelled buttons. Reduced motion suppresses decorative dust/curtain movement and the camera flash. A stable eye height avoids forced head bob.
- Desktop is the main target. Touch controls and a compact layout remain available as a fallback.

Sound starts only through the entry gesture with the visible environmental-sound checkbox selected, or the sound button. Narration remains independently opt-in. Sound pauses when the tab is hidden. Volume and mouse sensitivity are adjustable. All atmospheric sound and foley are original Web Audio synthesis: air, birds, room crackle, wood/stone footsteps, door/drawer motion, paper, switches, ceramic and shutter. They are not field recordings or historical audio.

## Rendering and limits

The scene uses a generated equirectangular background, photographic tree cutouts, instanced tapered grass, rounded furniture edges, physical material maps, window light, a responsive lamp, curtains, books, a woven runner, logs and subtle dust. Balanced mode keeps antialiasing and shadows; Cinematic adds multisampled GTAO contact shading. No recurring API or asset-network calls are needed to explore the house after local assets load.

This remains procedural web 3D rather than photogrammetry or a production game environment. The distant panorama is scenery rather than walkable terrain. The camera, household objects, notes and architecture are recreated. Only the supplied Figure 1 image is presented as historical. The field notes are a contemporary summary of the already sourced 1931/1932 Swiss visits, not an invented facsimile or a claim that this was Price's house.

## Assets and licenses

All new runtime assets are stored in `public/cinematic/chalet-v2/`.

- `alpine-panorama.png` / `.webp`: generated Alpine panorama, 1774 × 887.
- `alpine-fir.png` / `.webp`: generated transparent fir cutout; WebP keeps alpha and uses 768px width.
- `old_wood_floor-{color,normal,roughness}.jpg` / `.webp`: [Poly Haven Old Wood Floor](https://polyhaven.com/a/old_wood_floor).
- `clay_plaster-{color,normal,roughness}.jpg` / `.webp`: [Poly Haven Clay Plaster](https://polyhaven.com/a/clay_plaster). The wall uses its normal/roughness maps with a pale plaster base color.
- `forest_ground_04-{color,normal,roughness}.jpg` / `.webp`: [Poly Haven Forest Ground 04](https://polyhaven.com/a/forest_ground_04).

Poly Haven materials are [CC0](https://polyhaven.com/license). Exact download URLs and local filenames are recorded in `public/cinematic/chalet-v2/sources.json`. Sharp produced WebP runtime copies; source assets remain available. Existing wood/stone materials and original photographs are retained.

### Generated asset prompts

Both images were generated with the built-in image-generation tool, then copied into the project. No external image API or key was used.

**alpine-panorama-v2**

Use case: photorealistic-natural. Asset type: 360-degree equirectangular environment panorama for a first-person web experience set in an imagined Alpine valley inspired by Lötschental, Switzerland, early twentieth century. Generate an extremely wide 2:1 landscape image with a level horizon exactly across the vertical middle, suitable for mapping onto the inside of a sphere. View from a grassy meadow, surrounded by distant forested slopes, rugged snow-dusted Alpine peaks, scattered small dark timber chalets far away. The bottom third is natural muted alpine grass; upper half blue-grey sky with luminous clouds. Late afternoon warm sunlight from the right, soft haze separating mountains. Photographic natural detail, understated colors, no exaggerated saturation, no illustration. No foreground buildings, no people, no modern infrastructure, no text. Panorama must be seamless at left/right edges, no black borders. This is an artistic environment, not an archival photograph.

**alpine-fir-v2**

Use case: photorealistic-natural. Asset type: transparent-background tree cutout for a 3D Alpine environment. One complete mature European silver fir tree, seen straight-on at eye level, including the tip and the visible trunk down to ground level. Tall irregular tapered form, layered naturally drooping branches, many fine needles and small realistic gaps between branches, muted deep forest-green needles, weathered brown trunk. Soft neutral daylight, extremely detailed photographic botanical cutout, realistic uneven silhouette, not a cone, no toy or stylized look. Centered isolated tree with generous transparent space around every edge. No ground plane, no scenery, no cast shadow, no text. Genuine transparent background.

## Verification

All 23 tests pass, including the existing documentary/archive checks, routes between every interactive station, collision/tunneling, frame-rate independent movement damping, viewfinder cropping, discovery completion and local texture/alpha integrity. Production build and targeted ESLint on the changed house modules pass.

Desktop browser checks completed all seven discoveries, guided entry, lamp, drawer, window, object transitions, photo flip/source, captured JPEGs and the notebook. Returning through the archive, globe and documentary preserves the house position, room settings and session photographs. Both Balanced and Cinematic rendered without captured console errors. Sound controls and event plumbing were exercised; no independent recording-based listening review was performed. The generated JPEG was verified in the notebook (1024 × 683); the browser automation policy blocked downloading its data URL, so the download-to-disk step remains manually verifiable. No workaround was attempted.
