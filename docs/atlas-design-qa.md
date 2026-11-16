# Archive Wall design QA

## Comparison target

- Source visual truth: `C:\Users\mateo\.codex\generated_images\01a06ca8-810e-75e1-8c07-18a1dc9c3731\exec-706a1bb9-d95e-4e4c-80b9-58d7d01135bc.png`
- Implementation: browser-rendered `http://localhost:3000/` capture in the Codex in-app browser (not persisted by the browser runtime).
- Viewport: 1440 × 1024 CSS px for the implementation; source mock is a desktop 1440 × 1024 design target.
- State: Chapter 01, first field stop, light Atlas surface.

## Evidence and checks

- Full view: reviewed the source mock and browser capture together at desktop scale. Both use a pale editorial left panel, a full-height map region, three dark route labels, and a photographic route strip at the bottom.
- Focused regions: reviewed the title/photo/field-note composition, the map route and active stop treatment, and the bottom thumbnail rail. Separate focused crops were not needed because these regions were legible in the desktop capture.
- Primary interactions tested in browser: selecting a route stop updates the current location; selecting the Pacific chapter updates title, route, photo, stops, and field-chapter link.
- Browser console: no errors or warnings observed in the final Atlas validation.

## Findings

- [P3] The live basemap is intentionally less textured than the generated topographic mock because it remains a real, zoomable map layer. The sage overlay, route, location labels, and controls preserve the intended hierarchy without substituting a static image.

## Required fidelity surfaces

- Fonts and typography: display serif and compact sans hierarchy match the source's editorial contrast; chapter title, small labels, and route cards remain legible.
- Spacing and layout rhythm: the 44/56 editorial-to-map split, full-bleed bottom rail, slim chapter index, and restrained borders match the source composition.
- Colors and tokens: warm paper, charcoal cards, moss-tinted map surface, and brick-red active route are consistently applied.
- Image quality and asset fidelity: original conceptual archival recreations are used for hero and timeline imagery; no placeholder imagery is present.
- Copy and content: existing expedition, stop, country, date, and chapter-link data are preserved.

## Implementation checklist

- [x] Restore the Atlas runtime after the unrelated project collision.
- [x] Implement the selected Archive Wall layout and responsive states.
- [x] Add original archival recreation assets for the route rail.
- [x] Verify production build and main interactions.

final result: passed
