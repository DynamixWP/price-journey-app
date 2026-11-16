# Connected documentary — Switzerland and Aotearoa New Zealand

Local application: http://127.0.0.1:3000/

## Experience

The eight-scene documentary uses the supplied Price portrait, Figure 1 (Lötschental) and Figure 68 (Rotorua Dental Clinic). Four additional narrated details connect the church, landscape, clinic sign and people to readable sources. The separate Arctic gallery contains the earlier clearly identified AI concepts; those images are outside the documentary and have no map locations.

The atlas is a full-viewport section, not a native dialog. The documentary remains mounted and inert beneath it. Its audio element, currentTime, scroll position, automatic/manual mode, captions and sound preferences survive the excursion. The atlas can open photographs; closing them returns to the same map. Return to documentary restores focus and continues the prior playback state. Escape also returns from the atlas. Satellite and cartographic layers remain available, with photo access if map tiles fail.

## Within the photograph — v5

Documentary hotspots now hold the current passage and move the existing camera toward the selected detail. The narration, timed subtitles, alternate details and source disclosure remain inside that photographic scene. The return control preserves the documentary audio time, scroll position and automatic/manual state. Detail narration can be paused and resumed independently. Only the explicit replay controls start at zero.

Photographs opened from the globe or collection now use a full-viewport photographic scene with connected thumbnails, source notes and same-image narrated details for the Swiss and Rotorua photographs. Closing the scene returns to the previous atlas or documentary view. Gentle optical camera movement is optional and respects reduced motion.

The atlas now contains eight historical image assets across six regional destinations: Lötschental, Rotorua, Cusco, Rarotonga, North Island and New Caledonia. World markers group related records; destination cards and thumbnail galleries expose individual photographs. Optional Orbit slowly rotates the globe and stops on interaction. New assets are derived from supplied originals, with sources and location limitations documented in [expanded-archive-sources.md](expanded-archive-sources.md).

## Narrated atlas — v6

Every historical image in the atlas now has an interactive narrated point. There are eleven passages in total: four for the Swiss and Rotorua photographs, two for the Peru plate, and one for each of the five Pacific portraits. New scripts and sources are documented in [atlas-narration-sources.md](atlas-narration-sources.md).

The photo explorer is one persistent session while the visitor changes images. The ambient score continues, the outgoing voice pauses, and the selected photograph's voice starts or resumes from its own saved position. Pausing the voice is retained on manual image changes. The optional photo journey advances through each image's details and then the next photograph, with a short musical pause between passages. It stops at the end of the collection. This presentation order is not asserted as Price's historical itinerary.

Photographs crossfade inside the same viewport. Portraits and the Peru plate use their native dimensions for both hotspots and zoom. Previous/next controls, the connected filmstrip, source text and a direct documentary-return button remain available. The main documentary stays mounted and paused throughout the atlas excursion. Its original voice clock and automatic/manual state are restored on return. These bookmarks last for the current page session, not across reloads.

## Historical sources

- [Price, Swiss field studies, April 1933, reproduced by ANF](https://theancestralnutritionfoundation.org/research/why-dental-caries-with-modern-civilizations-2-field-studies-in-primitive-valais-wallis-districts-switzerland/): summer 1931 visit and 1932 return.
- [Nutrition and Physical Degeneration, chapters 3 and 12](https://gutenberg.net.au/ebooks02/0200251h.html): Figure 1; John Siegen; hay, rye and protected forests; Figure 68; Colonel Saunders and an unnamed dental operator. Historical observations are attributed to Price; medical conclusions are not presented as contemporary evidence.
- [Manatū Taonga, first school dental nurses](https://nzhistory.govt.nz/page/first-trainee-school-dental-nurses-appointed): 30 trainees started in Wellington on 4 April 1921. This describes the national programme, not the date of the Rotorua photograph.
- [Publication record](https://soilandhealth.org/book/nutrition-and-physical-degeneration/): first publication in 1939.

The map uses an approximate valley reference (7.77 E, 46.42 N) and a city reference (176.25 E, 38.14 S). Neither is an asserted camera position or a verified address of the original clinic. Each map card explains its geographic precision. Photograph exposure dates, original catalog accessions and rights remain for archive review.

## Audio

Eight English documentary clips and four detail clips are generated with en-GB-RyanNeural at -12%. This is a contemporary synthetic narrator, not Price's voice. The optional ambient score is original synthesized audio. Scripts, sentence timing and local MP3s are stored in lib/experience and public/narration. The generator reuses unchanged clips and creates both narration and detail manifests.

The continuous camera uses the narration clock in automatic mode and scroll position in manual mode. It retains a separate clock for automatic playback without voice, including atlas excursions. A click is required to enable sound. OS reduced motion takes priority.

## Verification

TypeScript and production build passed. Six Node checks cover camera geometry, historical image aspect ratios, audio/transcript correspondence and subtitle timing. Browser verification and screenshots are recorded in design-qa.md.

For local development: npm run dev. For the compiled preview: npm run build, then npm run start -- --hostname 127.0.0.1 --port 3000.
