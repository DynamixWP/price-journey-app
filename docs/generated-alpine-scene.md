# Alpine living scene

Historical implementation notes for the first arrival prototype. The current branch replaces automatic narration with [place exploration and opt-in descriptions](alpine-place-exploration.md); the original layer prompts below remain applicable.

Implemented 2026-11-17. Enter from **Living scene** in the navigation or **Enter the living scene** on the opening screen.

## Experience

A twenty-second narrated arrival, with three independently animated image planes. Scroll, touch swipe or the keyboard-accessible progress slider controls the camera; Resume continues from that position. The village and landscape discoveries move the camera within the scene and have their own recorded voice. Leaving a discovery restores the arrival's progress and play/pause state. The full-screen globe and original photograph suspend the scene without unmounting it; returning preserves audio position. Closing and reopening the scene preserves its place for the current page session. A reload starts a new session.

The existing synthesized ambient score continues across the scene, photograph and globe. Narration ducks the music. Sound and playback pause on tab hiding. Device reduced-motion preference and the existing Gentle motion setting disable continuous camera travel and pointer parallax. Mobile detail buttons keep both discoveries reachable when a tall viewport crops the corresponding hotspot.

## Historical boundary

All three plates are generated artistic reconstructions, not archive photographs or an accurate survey of a historical village. Visible labels identify this throughout. The generated church is not presented as Siegen's actual church. The separate original-photograph view uses the supplied Figure 1. The contemporary script refers to Price's account, without repeating its health claims.

Historical source checked: [Nutrition and Physical Degeneration, Chapter III](https://gutenberg.net.au/ebooks02/0200251h.html), paragraphs following Figure 1: John Siegen as pastor and collaborator; hay, rye and protected forests. Globe coordinates remain regional references, not a camera position.

## Assets and tools

Images generated with the built-in image_gen tool. The village and foreground used the valley as a lighting/perspective reference and requested transparent output. PNG masters are in `public/cinematic/alpine/`; matching WebP delivery assets retain alpha and total 824,078 bytes. Sharp was used only for delivery-format conversion, not generative editing.

- `valley.png` / `valley.webp`: opaque mountain and valley background.
- `village.png` / `village.webp`: transparent village and church middle plane.
- `foreground.png` / `foreground.webp`: transparent spruce and grasses foreground.
- `public/narration/alpine-arrival.mp3`, `alpine-church.mp3`, `alpine-landscape.mp3`: local English demo voice, generated with the project's existing Edge TTS workflow (en-GB-RyanNeural, -12%). Playback makes no live speech-generation request.
- Script and sentence timing: `lib/experience/cinematic-script.json` and `cinematic-manifest.json`.

This implementation renders the motion interactively in the browser. It does not produce an MP4 or interpolate independently generated frames. No new paid video service or API key is required for playback.

## Final image prompts

### Background

Use case: historical-scene. Asset type: background plate for a layered cinematic web documentary about Weston A. Price's Swiss journey. Generate a photorealistic wide landscape, ideally 1536x1024 or wider landscape, Swiss Valais / Lotschental inspired alpine valley in summer, atmosphere of early 1930s. This is an explicitly labeled artistic reconstruction, not an archive photograph. Camera at a low hillside looking along the valley. Immense grey rocky Alpine peaks and thin patches of distant snow occupy upper half, deep evergreen slopes down both sides, an empty sunlit muted olive meadow and very subtle winding dirt path occupy bottom 40%, atmospheric mist far in the valley. Keep the central lower valley empty for a separate village layer to be composited later. NO buildings, churches, people, vehicles, fences, text or watermarks. Natural understated analog film color: cool slate mountains, subdued forest green, warm ivory sunlight, gentle grain; exquisite photographic texture, quiet cinematic light from upper left, realistic geography. Full-bleed opaque image, clean uninterrupted landscape through every edge, high detail, no artificial frame or UI. Composition with open mid-right lower region for church at x62%, y67%; dimmer left third can support editorial overlay.

### Village

Use case: historical-scene. Asset type: transparent midground layer for a 1536x1024 cinematic parallax scene. The attached alpine landscape is ONLY a lighting, perspective and color reference; DO NOT reproduce its mountains or sky. Generate a separate isolated group of small early-1930s Swiss Valais wooden chalets, stone barns and one modest white-plaster village church with a dark slender spire. Genuine transparent alpha background. Match reference's restrained photographic realism, muted olive/grey/brown palette, grain and soft sunlight from upper left. Match a slightly elevated hillside camera looking toward a distant valley. Layout is important: leave top 45% of the canvas fully transparent; village occupies roughly x25%-94%, y50%-95%. Church is centered at x63%, its spire tip at y48%, walls and base ending at y82%; houses cluster around it lower down. Buildings recede naturally in perspective; church is the visual anchor, not a huge cathedral. A small irregular patch of meadow and stone paths grounds the buildings, feathered naturally into transparent edges at the bottom; no rectangular base or diorama pedestal. Keep silhouette of roofs and church precisely cut out. No people, cars, modern objects, text, sky or mountains. Output one wide 1536x1024 transparent PNG asset, not a montage or mockup. Preserve empty transparent margins, intended for layering directly over the provided landscape.

### Foreground

Use case: historical-scene. Asset type: transparent foreground vegetation layer for a cinematic Alpine parallax web scene. Reference image supplies only lighting and palette. Produce one wide 1536x1024 PNG with genuine transparent alpha. A few very close, softly focused dark spruce branches intrude from the extreme upper-left and left edges, with a small fringe of Alpine meadow grasses and out-of-focus seed heads along the bottom-left corner and very bottom-right corner. The central 70% and entire right upper portion must be completely transparent for a village and church behind this layer. Think photographic foreground framing, not a wreath. Restrained cinematic realism, olive and deep forest greens, warm soft sunlight from upper-left, fine analog film texture. Branches should enter naturally from beyond canvas, not float. No mountains, sky, landscape background, ground plane, buildings, text, frame, people or solid background. Maximum vegetation coverage 20% of total canvas; leave the center empty. Match atmospheric Alpine reference. Use soft but clean alpha edges.


