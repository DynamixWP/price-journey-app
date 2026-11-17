# Walkable Alpine house

The current desktop version is documented in [chalet-desktop-v2.md](chalet-desktop-v2.md), including seven discoveries, environmental sound, the usable camera and new assets. The notes below describe the initial implementation.

A continuous Three.js scene extends the photographic village: walk from the entrance through a hinged door, explore one furnished room, and lift three objects without leaving the scene. This is an artistic prototype, not a reconstruction of a documented building or Price's possessions.

## Try it

Run `npm run dev`, open `/`, and choose **Walk inside the house**. The photographic village also includes this entrance.

- **Guided:** follow the approach, threshold, interior, table, window, and return outside. Each stop waits for the visitor. Pause and resume retain the current destination; a navigation grid finds a route from a free-walk position.
- **Free walk:** drag to look and use WASD/arrows to move. Optional mouse capture releases with Escape. On a phone, hold the directional buttons and drag the scene.
- **Objects:** click a nearby object, use E while looking at it, or use its enabled Examine button. Drag or use rotation buttons, adjust distance, optionally listen, then return it to the table. Camera, bowl and print have real geometry and restore their original transforms.
- **Sound:** ambience and narration start off. Optional synthesized ambience changes at the threshold and includes footsteps. Recorded synthetic descriptions play only on request, duck ambience, and retain their positions per object.
- **Connected exploration:** the globe and archive suspend the 3D renderer and voice; returning preserves camera position, door, inspected objects and the held object. Returning to the documentary restores its bookmark. These bookmarks last for the mounted page session, not a browser reload.

## Implementation

`chalet-world.ts` builds timber walls, roof, windows, furnishings, the hinged door and three objects. `chalet-layout.ts` contains collision bounds, player radius, movement substeps, A* navigation and editorial descriptions. `chalet-engine.ts` handles renderer lifecycle, raycasting, movement, camera transitions and object transforms. `chalet-walk.tsx` supplies accessible controls, optional audio and overlay integration.

Three.js is loaded on first entry. Rendering stops while hidden or covered by the globe/archive. DPR is capped at 1.6. WebGL2 is required; a load/context error leaves a return control available. Reduced motion removes decorative easing; walking remains a spatial movement selected by the visitor. Desktop and 390px mobile layouts were reviewed in the browser.

The room is deliberately compact. Geometry is procedural and stylized, with generated surface textures; it is not photogrammetry or a photorealistic game environment. The distant landscape reuses a generated plate, so it is scenery rather than traversable terrain. The house connects to the existing photographic village through a view change, while its own entrance/interior is continuous 3D.

## Provenance and assets

The virtual print uses the supplied `public/archive-originals/npd-figure-001.jpg` and links back to the sourced Swiss photograph. Its paper object and placement are invented. The camera and bowl are explicitly described as imagined objects. No ownership, maker or household attribution is asserted.

New generated materials are in `public/cinematic/chalet/`: `aged-timber.png`, `alpine-stone.png`, and 1024px WebP runtime copies. Built-in image generation produced both originals; Sharp created the WebP copies. No external image-generation API is required at runtime.

Three optional voice files are in `public/narration/chalet-*.mp3`. `chalet-script.json` and `chalet-manifest.json` hold their complete text and timed captions. The existing `scripts/generate-narration.py chalet` workflow uses `en-GB-RyanNeural` at -12%; playback uses local files.

### Exact image-generation prompts

**aged-timber**

Use case: photorealistic-natural. Asset type: seamless square tileable base-color texture for the timber surfaces of a 3D early-1930s Alpine chalet. Produce a 1024x1024 opaque flat texture, orthographic straight-on view of richly detailed aged warm medium-brown larch wood, mostly vertical natural grain, subtle tiny knots and fine wear, no individual plank outlines, no perspective, no objects, no cast shadows, no directional illumination, no highlights, no text or watermark. Uniform diffuse lighting and color across all edges for seamless repeating. Natural warm tobacco and walnut browns, restrained color variation, realistic rough matte wood, not burned, not orange, not too dark. Full-frame material scan suitable for wrapping 3D beams, doors and furniture.

**alpine-stone**

Use case: photorealistic-natural. Asset type: seamless square tileable base-color material for a 3D Alpine stone path and foundation. Produce a 1024x1024 opaque orthographic top-down material scan of closely fitted irregular weathered grey-brown Alpine flagstones with restrained thin earthy joints. Small subtle moss traces only inside some joints, stone wear and mineral detail, warm slate and grey taupe palette, muted natural hues. Completely flat even diffuse light, no directional shadows, no perspective, no foreground objects, no text, no vignette, no border. Texture continues seamlessly across opposite edges. Realistic village paving, not decorative mosaic, stones about 20-40cm across.

## Verification

`npm test` checks collision/tunneling, routes from guided stops and free-walk aisles, and audio/text/caption integrity alongside existing documentary and atlas tests. Production build passes. Targeted ESLint passes for the new house files and parent integration. PhotoExplorer retains its pre-existing React Compiler preserve-manual-memoization diagnostics around choosePhoto; this change only adds its house return label. Browser checks cover the entrance, three objects, source photo, globe return, optional voice, mobile layout, and pause/resume.
