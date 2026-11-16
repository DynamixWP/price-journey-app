# Photographic journey prototype

The current narrated edition is documented in [documentary-preview.md](documentary-preview.md). It adds ten voiced scenes, captions, automatic progression and three supplied archival images to the v2 foundation described below.

The selected direction leads with photography and narrative. Story and globe are at `/`. The existing `/concept` route redirects to `/`; older atlas components remain in the repository.

## Run locally

Run `npm run dev` in this repository, then open `http://localhost:3000`. The verified session uses `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000`, bound to this computer only.

## Implemented

Seven scroll-controlled narrative beats across three photographs, with a pinned viewport, camera movement toward details, crossfades, scene navigation and an optional automatic journey. Native scrolling remains available; wheel, touch, navigation keys and opening a dialog pause automatic progress.

The globe offers satellite and vector atlas layers, photo markers, camera flights and entry into the photograph viewer. Whole world resets the camera after free exploration. Mobile controls, cards and attribution use a separate layout.

An original synthesized score changes musical palette and wind/water textures between ice, shoreline and shelter. Audio starts on user interaction, supports volume/mute and pauses when the tab is hidden. Existing detail hotspots, 100–300% zoom, pointer drag/reset, source panels, archive search and filters remain. Motion settings and system reduced-motion disable zoom/fades while keeping the story available.

MapLibre 6.18 uses locally served module workers. Installation runs `scripts/prepare-map-worker.mjs`, copying the matching worker and shared module into ignored `public/maplibre/`. Run it manually if dependency scripts were disabled. Maps require EOX/CARTO network access and WebGL2. This upgrade avoids the raster abort race observed when changing layers/closing the map in 5.24.

## Provenance

The three Arctic images are generated visual studies, not Price originals. The narrated edition adds a supplied portrait and two source-matched book photographs. Copy is provisional. No verified dates, collection identifiers or photo coordinates are invented. Map regions provide orientation, not a documented itinerary. The score is synthesized, with no archival recordings. No private email, transcript, contact data or supplied PDF is published by the app. There is no CMS, ingestion backend or archival document viewer yet.

## Grounding

Earlier research includes Joe's PDF, creative brief, functionality notes and meeting/email context. Live references inspected for this build include Night Watch's introduction and details, The Boat's chapter/sound controls and Hiroshima Archive's place navigation. Bear 71's landing was opened, without a full playthrough. Not every supplied reference was fully inspected interactively; a spirits reference stopped at an age gate.

- https://nightwatchexperience.com/en/
- https://www.sbs.com.au/theboat/
- https://hiroshima.archiving.jp/index_en.html
- https://bear71vr.nfb.ca/
- https://n.mapping.jp/index_en.html — globe, photo markers and place navigation inspected for v2.

V2 combines full-frame details and editorial pacing with a separate spatial mode inspired by Hiroshima/Nagasaki. It uses MapLibre; no video or 360 footage is embedded.

## Next implementation slice

1. Select reviewed Arctic photographs with original captions, stable collection IDs, rights and location evidence.
2. Replace `lib/experience/content.ts` study records; link each image to its caption and an actual source document.
3. Edit the narrative with the project team and appropriate community expertise. Distinguish historical source, interpretation and later research.
4. Replace the provisional score with approved music/ambience; add narration and transcripts.
5. Introduce tiled deep zoom for high-resolution originals, responsive derivatives and the content pipeline.

This demonstrates the experience and navigation model. It is not a production archive or historically reviewed Arctic chapter.
