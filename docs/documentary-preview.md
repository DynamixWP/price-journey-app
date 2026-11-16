# Documentary preview

Ten scenes combine a supplied Price portrait, two historical photographs and the three existing Arctic visual reconstructions. The synthetic English narrator is a contemporary guide, not an impersonation or recording of Price. Spoken passages total approximately 224 seconds, plus transitions: around four minutes.

## Presentation

Use **Watch the documentary** for voice-led automatic camera movement, or **Explore at your pace** for manual scrolling. Scrolling or selecting a scene takes control from the automatic journey. Pause/resume, voice, subtitles, replay narration and master sound are available in the bottom transport. The transcript follows the immersive chapter. Opening a photograph pauses the documentary; resume from the transport after closing it.

The HTML audio clock controls automatic progress. Each scene has its own local MP3 and sentence-timed captions. Manual scene changes stop the previous clip and start the new passage after a short dwell, without overlapping voices. Music ducks to 27% of the selected music level while the narrator speaks and returns afterward. Tab hiding pauses sound and automatic progress. Voice can be disabled while music continues.

## Media and historical context

Files copied from the user-specified project folder; originals left untouched:

| Local source | App asset | Context |
| --- | --- | --- |
| Landing/NPD 01_1.jpg | public/archive-originals/weston-price-portrait.jpg | Supplied portrait; exact date, photographer and catalog reference unconfirmed. |
| Landing/NPD 300_Fig_001.jpg | public/archive-originals/npd-figure-001.jpg | Visually matched to Figure 1, Lötschental Valley, chapter 3. |
| Landing/NPD 300_Fig_068.jpg | public/archive-originals/npd-figure-068.jpg | Visually matched to Figure 68, a New Zealand dental clinic, chapter 12. Rotorua is visible on its sign. The man is not labeled as Price. |

Price describes Swiss fieldwork in 1931 and 1932; these dates are not assigned as precise photo exposure dates. His April 1933 article is reproduced by ANF:
https://theancestralnutritionfoundation.org/research/why-dental-caries-with-modern-civilizations-2-field-studies-in-primitive-valais-wallis-districts-switzerland/

Figures/captions and surrounding historical text:
https://gutenberg.net.au/ebooks02/0200251h.html

1939 publication metadata:
https://soilandhealth.org/book/nutrition-and-physical-degeneration/

These are historical source references, not endorsement of the book's scientific conclusions. No invented testimony, accession IDs, photo dates or health statistics were added. Image source panels distinguish supplied historical assets from AI visual reconstructions. Rights/catalog review remains necessary before public publication.

## Voice assets

`lib/experience/narration-script.json` holds the editorial script. `narration-manifest.json` links the local clips and sentence cues. `public/narration/` contains the ten MP3s; playback does not contact a speech service.

Generation used edge-tts 7.3.1, voice `en-GB-RyanNeural`, rate `-12%`. Only the non-confidential demo script was sent to synthesis; no private correspondence or images were transmitted. The initially attempted Andrew multilingual voice returned no audio; the delivered files use Ryan.

To regenerate, install edge-tts in ignored `.tools/tts` with Python pip and run `scripts/generate-narration.py`. This is an authoring dependency, not a Next.js runtime dependency. A production release should choose an approved narrator/service and rights arrangements.

Source code and assets remain local. No publishing, emailing or external sharing was performed.

## Current local presentation server

The delivered session runs the compiled app on http://127.0.0.1:3000 (loopback only). To reproduce: `npm run build`, then `npm start -- --hostname 127.0.0.1 --port 3000`. Stop the presentation server before starting `npm run dev` on the same port. Production mode avoids development reloads interrupting narration.
