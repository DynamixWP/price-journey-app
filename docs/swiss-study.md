# The Swiss study — Price, photographs and a connected village

A later pass on arrival, light, object handling and interface is described in [swiss-immersion-pass.md](swiss-immersion-pass.md); it adds a twelfth discovery and replaces the permanent bottom bar described below.

Implemented on `feature/alpine-place-exploration`, extending the existing walkable house. Enter **Walk inside the house → Meet Price in the study**. This is a photographic presence with shallow geometric depth, not a rigged, walking 3D character. The seated body, chair and pose are generated from the supplied portrait; they are not an archival image of Price in this room.

## A visit

- Price sits behind the desk. Four editorial topics lead to the plate cabinet, Swiss reading companion or projection wall. No invented first-person dialogue is attributed to him.
- Five archive records can be held, rotated, brought closer and turned over to a contemporary source label. A light control makes the image more luminous. Records retain their native aspect ratios and regional context.
- The projector displays the selected image on the room's wall, and stays on while the visitor moves. It is an invented display mechanism, not a claim about a particular historical projector.
- The three-page reading companion uses contemporary paraphrases with a link to the published book. It is not a facsimile of a notebook.
- Twelve local MP3 readings are opt-in. They use the existing `scripts/generate-narration.py` pipeline, with the synthetic en-GB-RyanNeural narrator. Playback pauses when leaving the scene; in-memory bookmarks resume the same passage during the visit. No voice imitation of Price is used.
- The field notebook now contains eleven discoveries and links back to the four topics. Existing camera photography, object inspection, atmosphere and documentary/atlas return behavior remain available.
- The village has a visible Swiss trail: valley, village, church and study. Its house doorway leads to the walkable study. In the church, a candle can be lit/extinguished, a synthesized bell can be played, and a source-linked account of John Siegen connects back to the study. Candle state and views persist during the visit.

The village remains a photograph-based environment with animated transitions. The house is a navigable Three.js scene. Neither represents a surveyed reconstruction of a historical Swiss building. Reloading the page starts a new visit.

## Source review and records

The supplied project root and Landing folders were inventoried. Visual review included the Price portrait, both NPD 01/02 TIFF previews, all fifteen supplied digitized-negative PNGs including the `other options` folder, the Map 2 preview, and the existing contact sheet of the November archive/digitization photographs. Many files are alternate resolutions of the same images. Uncaptioned negatives were not assigned to Switzerland or to named people based on appearance.

| Record | Runtime asset | Source and limits |
| --- | --- | --- |
| Lötschental | `/archive-originals/npd-figure-001.jpg` | Supplied `NPD 300_Fig_001.tiff`; published Figure 1. Exact exposure date unconfirmed. |
| Mill and communal oven | `/library/swiss-mill-figure-002.jpg` | [Published Figure 2](https://gutenberg.net.au/ebooks02/0200251h-images/Fig.2.jpg). Only 375 × 227; deliberately not upscaled into invented detail. |
| Price portrait | `/archive-originals/weston-price-portrait.jpg` | Supplied `NPD 01.tiff` / `Landing/NPD 01_1.jpg`. Photographer and date unconfirmed. |
| Glass plates | `/library/archive-glass-plates.webp` | `Landing/Scanned images/2 - Josh Nov 2026 - Archive and digitization/Web (2400px)/GlassLantern_DSC1834.jpg`. Contemporary archive photograph; pictured plates are not all identified as Swiss. |
| Slide cabinet | `/library/archive-slide-cabinet.webp` | Same source folder, `GlassLantern_DSC1881.jpg`. Contemporary archive context. |

The Swiss dates, Siegen connection and Figure 2 interpretation were checked against [Price's published account](https://gutenberg.net.au/ebooks02/0200251h.html), especially chapter III and its captions. Historical medical conclusions are not presented as current clinical guidance. No new review of every email or of Joe's complete PDF was claimed in this iteration.

## Generated assets and exact prompts

Built-in image generation was used; no external image API key was needed. Selected assets were copied into the repository, with WebP runtime copies produced using Sharp. Supplied historical photographs were not generatively retouched.

### Seated photographic presence

Source reference: `D:/Mateo/Trabajo/ANF/Price Journey/Landing/NPD 01_1.jpg`.

Saved assets: `public/library/price-seated-recreation.png` and `public/library/price-seated-recreation.webp`. The WebP retains transparency. A slightly curved mesh adds shallow depth, with normal room occlusion and lighting. It does not produce unseen views of a complete human model.

Use case: historical-scene. Asset type: transparent photographic character cutout for a 3D web museum library. Input image 1 is an identity reference: the supplied archival portrait of Weston A. Price. Create a new artistic reconstruction of that same older man seated naturally on a simple dark wooden chair, facing the camera with a slight three-quarter angle, looking calmly toward a visitor. Preserve his recognizable high bald forehead, remaining short side hair, round wire-rim spectacles, facial proportions, expression and black bow tie from the reference. Full seated body, both shoes and entire chair visible, hands resting naturally on thighs, no desk or book obscuring him. Dark charcoal early-1930s suit, white shirt, subtle photographic texture, softly desaturated warm monochrome. Natural soft window light from upper right, balanced gentle fill, detailed face and hands. Camera at seated head height, normal perspective, portrait 2:3 framing with modest transparent margin. Genuine transparent background, no room, no floor, no shadow backdrop, no words, no watermark. This is an explicitly labeled artistic reconstruction, not a newly discovered archival photograph.

### Interactive chapel background

Source reference: the existing generated `public/cinematic/alpine/places/chapel-interior.png`.

Saved source: `public/library/chapel-unlit.png`. Runtime image: `public/cinematic/alpine/places/chapel-interior-interactive.webp` (1536 × 1024). The original remains unchanged. A flame/glow is added by the app at the niche candle, with reduced-motion support.

Use case: precise-object-edit. Input image is the edit target: an existing generated Alpine church interior used as an interactive background. Change ONLY the small candle in the recessed niche on the far right wall: extinguish its flame completely and remove the orange local halo cast on the niche. Keep the unlit wax candle, wick, metal candlestick and adjacent flower vase exactly in place. Preserve all architecture, crucifix, altar, other candles, wooden pews, window sunlight, photographic detail, perspective and image composition. Keep the exact 1536 by 1024 landscape framing. No other changes, no new objects, no text. This edited asset will have its flame added interactively by code, so the niche candle must be visibly unlit.

## Validation and implementation boundaries

Automated checks cover navigation among every house/library station, the unchanged free-walk aisles, source asset aspect ratios, image transparency, bounded record/page navigation, discovery completeness, and all local narration files and cue intervals. Browser checks cover Price topics, picking/turning/lighting plates, projection changes, book pages, audio pause/resume, source links, the church candle/bell and returning through the village and globe.

The voice control was replaced with local audio after the browser speech reader proved inconsistent in testing. All 25 tests, targeted lint for the modified modules, and production build passed. Browser playback reached `readyState=4`; pausing at approximately eight seconds and returning from the globe retained the book and offered Resume reading. The candle's unlit and lit appearances were both checked. No independent audio recording/listening audit was performed. Figure 2's small source limits its detail. The photographic figure has no lip sync or independent bodily animation; subtle perspective comes from the room and shallow mesh. Session state is in memory, not a saved account or reload-persistent game.
