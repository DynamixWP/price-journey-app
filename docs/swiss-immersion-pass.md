# Swiss immersion pass — arrival, light and a quieter interface

Branch: `feature/swiss-immersion-pass`, cut from `feature/alpine-place-exploration`. It builds on [the Swiss study](swiss-study.md) and [the desktop house](chalet-desktop-v2.md); those documents remain accurate for content and provenance, except where this page says otherwise. Nothing here was pushed or merged, and PR 9 is untouched.

## What a visitor notices

**One place instead of two.** The photographic village and the 3D house used to be joined by a hard cut, and nothing of the village could be seen from the house.

- Choosing the house door in the village now pushes the camera toward the doorway while the picture dips to dark; the house fades in from the same darkness. Leaving the house reverses it, and the village eases back out from the doorway. With reduced motion (device setting or Gentle motion off) both are immediate.
- The village of the valley scene, with its church, now stands in the distance beside the house and is framed by the study window behind Price. It is the existing transparent village plate (`public/cinematic/alpine/village.webp`) placed in the 3D scene; no new image was generated.
- The facade gained a stone footing, closed shutters, a flower box and stacked firewood, echoing the timber houses in the village plate. The firewood has a collision box.
- A twelfth discovery, **The same spire, from another window**: point at the distant church (from the path or through the window) to read how it relates to the church at the centre of Figure 1 and to Reverend John Siegen in Price's Swiss chapter. Two actions follow the thread: open the church detail inside the original photograph, or walk to the village church (the village opens directly on the church interior). The note states that the view is recreated and is not the church in the photograph.
- The first entry no longer shows an empty moment while the house code loads; a dark "Preparing your visit" screen bridges it.

**A house that belongs to the village.** The outside of the house was rebuilt with photographic CC0 material scans laid out at real scale: weathered horizontal boards on all four walls (cut around the two windows), vertical boards for the gables, door, shutters and corner posts, stone slates with bargeboards and a capped ridge on the roof, and a rubble-stone footing, path walls and chimney. A thread of smoke rises from the chimney, the meadow has short mixed-green grass and small flowers instead of large spikes, and the firewood now stands on the ground. The arrival point moved back along a longer path, so the first view takes in the whole house, the mountains and the village church together; the trees on the right stepped aside to keep the church in sight.

**More stories in objects, from real material.** Three things were added to the study, each with its source attached.

- *The route maps.* Three of the maps published in Price's book hang by the stove and can be taken down, turned over for their source and paged through: the Pacific (Map II), the North Island of New Zealand (Map V) and Peru (Map VI). Each note says only what the sheet itself shows, and "Find these places on the globe" opens the globe. The New Zealand legend lists twenty-one districts and writes number ten as "Rotarua"; the note keeps the map's spelling and connects it to the Rotorua clinic of Figure 68. The Peru sheet has no legend for its numbered stops, so they are not named.
- *Bread, cheese and milk.* A rye loaf and a wedge of cheese on the table carry Price's own account of daily food in the valley, checked against chapter 3: whole rye bread and summer-made cheese with fresh milk, meat about once a week, rye thrashed by hand and ground in stone mills, a community bake-oven used in turns, a month's bread baked at one time. One action puts Figure 2, the hand mill and the bake-oven, on the projection wall. The loaf and cheese are modelled objects, and the note says the account is history, not dietary advice.
- *Still waiting for a caption.* Two digitized negatives that arrived without captions rest on the bench. They are shown as they are, and the notes state that their place and date are not identified. Only scenes without identifiable people were chosen; the uncaptioned portraits in the same folder were left out.

- *A portrait that moves.* The animated portrait used in the home opening also hangs, framed, above the bench. It plays while a visitor is in the room near it, rests a few seconds between takes and stays still under reduced motion. A brass plaque on the frame reads "Portrait animated with AI · Not archival footage", and its note says the movement is generated, that it is not film of Price, and that the original photograph is unchanged in the plate cabinet; one action puts that original in the visitor's hands. It carries the same DomoAI watermark as the supplied file.

The notebook now has sixteen discoveries. The maps, the bread and the negatives have no recorded narration: Python and the speech tool used by the existing pipeline are not installed on this machine, so no new audio could be generated.

**Light and atmosphere in the study.** Timber was neutralised (it read as dark red), ambient light lowered and the sun strengthened so the room has shape. Sun shafts follow the sun from both windows to the floor, the stove has glowing embers with a restless warm light, the lamp flame flickers, dust catches the light, and the photographic figure of Price has a contact shadow and a soft key light. The cutout turns a little toward the visitor and breathes almost imperceptibly; it still does not walk, speak or lip-sync. The heavy bottom gradient was replaced by a light vignette.

**Objects in the hand.** When an object is lifted, the room behind it is softened and dimmed and the object is drawn sharp in front (works in Balanced and Cinematic). Dragging turns the object around the screen axes, and it keeps turning briefly after a quick drag; rotation buttons and "turn over" animate instead of jumping. When an object is returned, the view turns to follow it back to its place. Reduced motion removes the inertia and easing.

**Movement.** Guided walks ease in and settle at the destination. Walking has a small step rhythm (vertical bob and a trace of sway) with footsteps tied to it, and looking is lightly smoothed; all three are disabled by reduced motion. Clicking the floor shows a ring where you are going and keeps your heading on arrival. Pausing a walk and resuming now restores the whole intention (for example, the encounter panel still opens when you reach Price); previously the pending action was lost.

**Mouse look by default.** On a desktop with a mouse, entering the house captures the cursor after the visitor's own click: moving the mouse looks around, a click uses whatever is at the centre of the view or walks toward it, and Escape always frees the cursor. Anything that needs a cursor (the Places menu, the notebook, settings, Price's panel, the church note, an object in the hands) frees it automatically, and closing it hands the view back. If the browser refuses the capture, a prompt offers "Click the scene to look around" and dragging still works. Looking around no longer interrupts a guided or click-to-walk route; it only takes the view back from the guide for a moment. A click now always means "go that way": if the clicked spot cannot be stood on, the visitor walks to the nearest place on the way to it. Settings and the Mouse look chip switch between captured mouse look and drag-to-look; touch devices keep drag. Captured look is deliberately calm: it turns more slowly than dragging, a single mouse movement can only turn the view a few degrees, the very large jumps browsers occasionally report are ignored, raw mouse input is requested where the browser offers it so that pointer acceleration does not make a quick flick overshoot, and the view eases after the mouse rather than snapping. The sensitivity slider in Settings still scales it. This replaces the earlier rule of never capturing the cursor: capture is now the default, but it is only ever requested from a visitor's click or key press.

**Less interface.** The permanent bottom bar (transport, two hint rows and ten object buttons) is gone. What remains: a crosshair only when aiming from the centre of the view, a contextual prompt for what you point at, **Places** (`M`) and **Field notebook** (`J`). The guided-walk button appears only during a guided walk or a paused one. Key hints fade after eighteen seconds; `H` still opens help. The mouse cursor now selects: hovering an interactive object shows a faint glint, a pointer cursor and its action. Every destination and object remains reachable from the Places menu for keyboard users.

**In the village.** The "Swiss trail" bar no longer blocks the hotspots beneath it (the valley's "Walk into the village" pin could not be clicked at 1440 × 810). On wide desktop viewports the row of buttons that duplicated the hotspots is hidden; it stays on narrow or tall screens, where a hotspot may fall outside the frame.

**Sound that has a place.** The house is now heard in space. The listener follows the visitor's position and the direction they face. The fire crackles at the stove and grows louder on the way to it; the valley (air, gusts, birds) is all around outside, and inside it comes through the window or the door, clearly when they are open and faintly when they are shut; the fire is muffled from outside; the door, drawer, lamp and window sound from where they are; a quiet bell comes now and then from the direction of the village church. A short musical swell marks stepping into the room. Footsteps vary in pitch and level. Everything is original Web Audio synthesis, plays only when environmental sound is on, and is best on headphones. Narration remains opt-in everywhere.

**An opening for the house.** Before the visit starts, the view pans slowly from the village toward the house while the titles arrive one at a time; with reduced motion the view is still. After entering, three tips are learned by doing and tick themselves off: look, walk, use. They can be skipped and never block the visit.

**A documentary opening for the home.** The home now begins with a living portrait of Price beside a line of the prologue ("A researcher. A camera. A world of questions."), then dissolves to the valley photograph, where the title and the actions arrive in turn. It lasts about six seconds, a click, a scroll or "Skip the opening" ends it, "Replay the opening" brings it back, and it is not shown at all with reduced motion. It plays without sound.

## Boundaries that have not changed

The village is photographic and the house is 3D; neither is a surveyed reconstruction of a historical building, and the distant village is scenery, not walkable terrain. The seated figure is a generated recreation on shallow geometry. No dates, places, quotations or dialogue were added beyond what the existing sourced text already states (Figure 1, the 1931 and 1932 visits, John Siegen). Historical originals and generated recreations remain separate assets with separate labels. Interface text is English. State is kept in memory while the page stays mounted: leaving for the globe, a photograph, the village or the documentary and coming back restores position, held object, room settings, discoveries and photographs. A reload starts a new visit.

## New assets and licences

Runtime files are in `public/cinematic/chalet-v3/`, with the exact download URL of every file in `sources.json` there. All four are [Poly Haven](https://polyhaven.com/license) scans under CC0, downloaded at 1K as colour, OpenGL normal and roughness maps and converted to WebP with Sharp (twelve files, about 1.7 MB in total). The original JPGs are not stored in the repository; they can be fetched again from the recorded URLs.

| Use | Asset | Author on Poly Haven |
| --- | --- | --- |
| Wall boards | [Weathered Plank Siding](https://polyhaven.com/a/weathered_plank_siding) | Dimitrios Savva |
| Gables, door, shutters, corner posts, bargeboards | [Weathered Planks](https://polyhaven.com/a/weathered_planks) | Dario Barresi, Dimitrios Savva |
| Roof and chimney cap | [Roof Slates 02](https://polyhaven.com/a/roof_slates_02) | Rob Tuytel |
| Footing, path walls, chimney | [Old Stone Wall](https://polyhaven.com/a/old_stone_wall) | Charlotte Baglioni |

These are generic material scans, not photographs of a Swiss building, and nothing about them is presented as historical. No image was generated in this pass.

### Archive material added to the study

Converted with Sharp from the supplied files, with no retouching, cropping or generated content. Originals are unchanged.

| Runtime file | Supplied source | What it is |
| --- | --- | --- |
| `public/library/maps/price-map-2-south-sea-islands.webp` | `NPD 300_Map_2.tiff` | Map II, South Sea Islands |
| `public/library/maps/price-map-5-new-zealand.webp` | `NPD 300_Map_5.tiff` | Map V, New Zealand |
| `public/library/maps/price-map-6-peru.webp` | `NPD 300_Map_6.tiff` | Map VI, Peru |
| `public/library/negatives/negative-img101.webp` | `Landing/Scanned images/3 - Digitized negatives (positives)/img101.png` | Uncaptioned negative: a sailing boat |
| `public/library/negatives/negative-img025.webp` | `…/other options/img025.png` | Uncaptioned negative: a shore with palms |

The map numbers were matched to the list of maps in the front matter of [the published text](https://gutenberg.net.au/ebooks02/0200251h.html) (II South Sea Islands, III Africa, IV Australia, V New Zealand, VI Peru). The passages behind the bread and cheese note, and the captions of Figures 1 and 2, were read in chapter 3 of the same text in this pass. Only the front matter and chapters 1 to 3 were read; the map images themselves were not located in that online edition, and Rotorua's mention in chapter 12 was not re-read. Maps III (Africa) and IV (Australia), Figures 32, 173 and 176 and `NPD 02.tiff` are in the project folder and remain unused: the online edition lists 134 figures, so the captions of 173 and 176 could not be checked, and the person in `NPD 02.tiff` is not identified.
### The living portrait

`public/cinematic/home/price-living-portrait.mp4` (560 × 752, about four seconds, no audio, 1 MB) was supplied by Mateo. It is an AI animation of the supplied portrait of Price; the visible watermark shows it was made with DomoAI. It is not archival footage and is labelled on screen as "Portrait animated with AI from the supplied photograph · Not archival footage". The file is used exactly as supplied: the watermark was not cropped or covered. Before this is shown publicly, replace the file with an export that carries no watermark under a plan that permits that use; the same file name drops in with no code change. The original photograph remains the poster frame and stays a separate asset.
## Implementation notes

- `chalet-engine.ts`: focus pass (room to a half-resolution target, blurred and dimmed, then the held object alone on render layer 1), spin inertia, guided pace, step rhythm, cursor/centre aiming, walk marker, glint, resumable intentions, `viewChurch`.
- `chalet-world.ts`, `chalet-dressing.ts`, `chalet-library.ts`: village plate and church target, facade details, sun shafts, lighting balance, embers, figure presence.
- `chalet-discoveries.ts`: `churchSight`, the twelfth discovery, and three small pure functions (`guidedPace`, `walkBob`, `spinDecay`) that are unit-tested.
- `chalet-walk.tsx` and its stylesheet: reduced interface, church note, arrival and departure veil.
- `alpine-cinema.tsx`: doorway push-in and veil, place requests from other experiences, dock no longer intercepts hotspots.
- `photo-journey.tsx`: passes the church detail to the photograph explorer and the church request to the village; loading fallback for the house.

No dependency was added. Three.js, Next.js and the audio pipeline are unchanged, and no narration file was added or regenerated.

## Verification

Automated, on this branch: `npm test` 36 of 36 pass (the 25 existing tests plus 11 new ones for pace, step rhythm, spin decay, calm mouse look, the church note, the recorded CC0 sources, the longer approach, the room sound mix, the labelled home opening, the sourced story sheets and the labelled living portrait; the notebook test now expects sixteen discoveries, and the narration test now names the objects that have no recording). `npx tsc --noEmit` passes. `npm run build` passes. `git diff --check` reports no whitespace errors. ESLint passes on every modified source file. ESLint over the whole project does not pass and did not before this work (1,160 problems, 59 errors, in files this pass does not touch, the MapLibre worker bundle and the `require` style of the test files).

In the browser at 1440 × 810, in the app's built-in browser pane: valley → village by its hotspot → house door with the dip to dark → guided entry; walk to Price, pause and resume, encounter panel; glass plate and photograph lifted, turned, turned over and returned; lamp lit by pointing and clicking; click-to-walk with its marker; church note from the path, the church detail opened inside Figure 1 and "Return to house"; "Walk to the village church" arriving in the church interior and back to the study; globe round trip while holding the turned photograph; documentary and back. Position, lamp, discoveries, held object and its orientation were preserved in each round trip. Cinematic mode, the viewfinder and a captured photograph were exercised with no WebGL error.

Not verified: the pane was running in the background, where the browser does not deliver animation frames, so the frame loop was driven by a timer for these checks. Frame rate, smoothness and transition timing on a real display were therefore not measured and need a look by a person. No listening review of the sound was made: the spatial sound started without errors and its mix rules are unit-tested, but nobody has listened to it. The home opening, the house opening pan, the staged titles and the three tips were checked in the pane. Reduced motion, touch and narrow layouts were not exercised in the browser in this pass. Pointer capture could not be granted by the background pane (the browser answered with a pointer-lock error and the fallback prompt appeared), so the captured state was simulated to check the logic: one capture request on entry, looking without dragging, click-to-use and click-to-walk from the centre of the view, release on menu, notebook and held object, and recapture when they close. Real capture and its feel need a check in a foreground browser. The reference sites and Joe's PDF were not re-reviewed; direction follows the notes already in this folder.

## Known limits and next steps

- The distant village is a flat plate. It holds from the path and the window, but walking far to the side of the house reveals its angle.
- The house exterior is still simple geometry with photographic materials: flat boards rather than modelled logs, no balcony or carved detail. Visitors can only walk in the front yard, so the sides and back are seen at an angle and the roof slates mostly from below. The chimney is hidden by the roof from the arrival point and its smoke is faint against a bright sky.
- The focus pass renders the room at half resolution while an object is held; there is a brief softening as it starts.
- Sun shafts are additive sheets, not volumetric light; they read best from the doorway and the table.
- The study window shows the village only from positions that line up with it; there is no interior view of the church from the house beyond the note.
