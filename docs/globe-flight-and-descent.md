# The globe — guided flight, descent to the valley, paper atlas

Branch: `feature/swiss-immersion-pass`. This builds on the atlas described in [connected-documentary.md](connected-documentary.md); the places, photographs, texts and precision notes are unchanged.

## What changed

**A guided flight.** "Let the globe guide you" travels to each of the six places in turn, rests there with its card open, and moves on. Pause, Resume, Previous, Next and End are always available; dragging the globe, choosing a place or opening a photograph pauses the flight where it is. With **Voice** on, each stop plays the recorded passage of that place's photograph (the existing synthetic narrator), shows its captions and waits for the passage to end; the voice is off until it is asked for. The documentary score lowers under the voice.

No route is drawn. The flight follows the order in which the places are displayed, and the bar says so on screen: "An order for viewing the collection. It is not a route, and not Price's itinerary." Nothing in the globe claims where Price travelled between places, or when.

**A descent into the valley.** The Lötschental card has a new action, "Descend into the valley". The interface fades, the camera drops for about seven seconds over the real relief of the Alps around the valley reference, the picture dips to dark, and the photographic valley of the living scene fades in from the same darkness. Going back the other way, "Globe" from the valley or the house opens the globe close above the valley and rises to the regional view. With reduced motion the descent skips the camera move and opens the valley directly.

The relief is real elevation data, switched on only when the camera is close to the ground. It is centred on the same regional reference the atlas already used (7.77 E, 46.42 N), which is not a camera position; the caption during the descent repeats that. The valley the visitor then walks into is the generated photographic scene, not a view of that terrain.

**A paper atlas.** The second layer, formerly a stock light basemap, is now the project's own: sepia paper, a sage sea, ink lettering with country names in spaced capitals, dashed borders, a graticule every fifteen degrees and soft shaded relief on the land. It is a restyling of a published basemap, so coastlines, borders and names remain the provider's. Buildings, points of interest and icons are removed. If the restyling cannot be loaded, the plain basemap is used.

**Photographs as prints.** The pins sit slightly tilted, like prints laid on a table, and straighten and lift under the pointer or when selected.

Also fixed: the globe no longer sets state inside an effect when another photograph is requested from outside, which was one of the errors in the whole-project lint.

## Providers and attribution

The globe needs the network; nothing here changes that. If the providers cannot be reached the existing message and the photograph rail remain.

| Layer | Provider | Notes |
| --- | --- | --- |
| Satellite imagery | Sentinel-2 cloudless, EOX | Unchanged |
| Paper atlas geometry, names and fonts | CARTO basemap (Positron), restyled in `lib/experience/atlas-style.ts` | Fetched once per visit and transformed in the browser |
| Elevation (relief and hillshade) | [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), Mapzen, AWS Open Data | Terrarium encoding; attribution is shown in the map |

No API key is used by any of them.

## Verification

Automated: `npm test` 38 of 38 pass, with two new tests. One runs the paper-atlas transform on a small style and checks that the input is not mutated, filters and zoom ranges are kept, buildings, points of interest and icons are removed, and relief, graticule and elevation sources are added. The other checks that the flight visits every place once, that every place has a recorded passage, that the flight waits for the whole passage, and that the globe source draws no line layer and carries both disclaimers. `npx tsc --noEmit`, `npm run build` and `git diff --check` pass. ESLint passes on the modified files, including `spatial-archive.tsx`, which previously failed.

In the app's browser pane at 1440 × 810: the satellite globe with tilted prints; the paper atlas at world scale and over Switzerland with relief; the flight starting, stepping to the next place and pausing; the descent over three-dimensional terrain and its arrival in the valley; and the return from the valley rising to the Swiss view.

Not verified: the pane runs in the background, so the map was driven by a timer instead of animation frames. Frame rate, the smoothness of the camera moves and the timing of the fades were not measured. The voice of the flight was not listened to. Tile loading over a slow connection, narrow layouts and reduced motion were not exercised.

## Limits

- The descent is only as detailed as the public imagery and elevation at that zoom; it is a landscape seen from above, not a model of the valley.
- The paper atlas inherits the provider's data and labels, and would need adjusting if that provider changes its layer names.
- The flight has one passage per place; places with several photographs play the passage of their cover photograph.
- There is still no offline fallback for the globe.
