# Photographic Journey — design QA

## Target and evidence

- Source: C:/Users/mateo/.codex/generated_images/01a1e54d-a04c-7bc3-aa67-2976ee8b84e7/exec-3f101ec3-2f97-413f-83ba-e9d8727f31c6.png
- Implementation: http://127.0.0.1:3000/, rendered and operated in Chrome.
- Screenshot: C:/Users/mateo/.codex/visualizations/2026/11/16/01a1e54d-a04c-7bc3-aa67-2976ee8b84e7/price-journey-desktop.jpg
- Desktop CSS viewport: 1440 × 1024. Source raster: 1488 × 1058. Captured raster: 1425 × 1013. Nearly equal aspect ratios were compared at equal display width, without browser chrome or a device frame. No pixel-perfect metric is claimed.
- Mobile CSS viewport: 390 × 844, approximately 375 px content width excluding scrollbar, DPR approximately 1. Hero, viewer, chapter menu and shoreline screenshots were inspected in tool output; these additional captures are not persisted.
- State: initial hero, audio off, no modal. Final desktop capture has motion off for a stable crop.
- Reference and revised screenshots were displayed together in the same comparison input. Header, title, CTAs, hotspot and ivory chapter transition were legible; separate focused crops were unnecessary.

## Comparison history

1. [P2, fixed] Initial title was too low/right and navigation/CTAs too small. Moved hero copy from 8%/25% to 4.7%/14%, increased display weight/size and restored larger serif navigation/CTAs. A fresh joint comparison confirmed the corrected hierarchy.
2. [P2, fixed] Progress controls disappeared against ivory sections. Added dark controls on paper sections; retained light controls on dark imagery.
3. [P2, fixed] Mobile sound control lost its accessible name when text was hidden. Added changing aria-label; subsequent mobile accessibility tree reports Sound off.
4. [P2, fixed] Hero overlay was too light for small text. Increased opacity and captured a fresh joint comparison. Final saved screenshot includes this adjustment.

## Required fidelity surfaces

- Typography: Cormorant Garamond italic display and serif navigation, with compact Inter supporting text. Title wraps in two lines. Supporting wording intentionally avoids unimplemented field-note promises.
- Spacing/layout: full-bleed hero occupies 84% of the desktop viewport, followed by the ivory chapter transition. Story sections and dialogs extend the single-screen mock. Mobile stacks content without horizontal document overflow.
- Colors/tokens: warm ivory, charcoal and muted green; dark image overlay; distinct progress/selected states.
- Image quality: Arctic sled composition and two complementary monochrome studies. Generated-image provenance is visible; library icons are used. No fabricated archival metadata.
- Copy/content: source disclosure and functioning map navigation intentionally replace the mock's archive-record link until actual sources are integrated.

## Functional verification

Chrome checks passed for entry scroll, chapter jump on mobile, detail opening, zoom to 150%, pointer drag (observed 100/50 px translation), next photograph/reset, source panel, live map load, Greenland selection, map-to-photo return, archive search, unmatched-query empty state, reset and Daily life filter. Escape closes the modal; opening focuses its close control. Sound toggles on/off, volume changes from 35 to 36 via keyboard, and motion toggles off. This checks audio controls, not subjective sound quality through the user's speakers.

## Code checks and console

- TypeScript passed; scoped ESLint passed for experience components/modules, site frame and page/layout.
- Production build passed and generated all eight route outputs. An initial sandboxed build could not fetch Google Fonts; the network-enabled build succeeded.
- Console review found a hydration warning from browser-extension-injected bis_skin_checked/bis_register attributes. No app-origin runtime exception appeared during tested interactions. The extension was not disabled and warnings were not suppressed.
- The pre-existing theme effect in components/nav.tsx triggers React's set-state-in-effect lint rule when that legacy file is included. It was not rewritten.

## Follow-up polish and limits

- [P3] Generated photograph crop differs from the mock's image crop; sled, figures and horizon remain the visual anchors.
- Full keyboard panning, pinch zoom, cross-browser coverage, offline maps, narrated audio and production asset optimization remain future work. Zoom buttons and detail controls are keyboard accessible.
- Pass applies to the functional local visual prototype. Historical approval and production readiness remain separate work.
- Previous atlas QA preserved at docs/atlas-design-qa.md.

## Checklist

- [x] Preserve existing atlas at /concept.
- [x] Implement photographic direction and inspect desktop/mobile states.
- [x] Exercise primary interactions, review console and compile.
- [x] Save evidence and document limits.

final result: passed
