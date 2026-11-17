/** The published book these sheets and accounts are checked against (the same source the library uses). */
const priceBookSource = "https://gutenberg.net.au/ebooks02/0200251h.html";

/** A sheet the visitor can take in their hands: a real image on the front, its source on the back. */
export type StorySheet = { id: string; title: string; image: string; kind: string; source: string; local: string; aspect: number; text: string; url: string | null };

/** Route maps published in Price's book and supplied with the project files. They are itineraries, not camera positions. */
export const routeMaps: StorySheet[] = [
  { id: "pacific", title: "Across the Pacific", image: "/library/maps/price-map-2-south-sea-islands.webp", kind: "Published route map · Map II", source: "Nutrition and Physical Degeneration · Map II, South Sea Islands", local: "NPD 300_Map_2.tiff", aspect: 1320 / 1428, url: priceBookSource,
    text: "A hand-drawn line leaves San Francisco and connects the Marquesas, Tahiti, Rarotonga, Nukualofa, New Caledonia, Fiji, Samoa and Hawaii. Rarotonga and New Caledonia are also places on the globe of this experience. The line is a published itinerary; it does not say where any single photograph was taken." },
  { id: "new-zealand", title: "Twenty-one stops on the North Island", image: "/library/maps/price-map-5-new-zealand.webp", kind: "Published route map · Map V", source: "Nutrition and Physical Degeneration · Map V, New Zealand", local: "NPD 300_Map_5.tiff", aspect: 1324 / 1838, url: priceBookSource,
    text: "The route arrives from Sydney at Wellington and leaves from Auckland for Fiji. Its legend numbers twenty-one districts, all on the North Island. Number ten is written “Rotarua”: Rotorua, where the dental clinic of Figure 68 stands on the globe. The spelling is the map’s own." },
  { id: "peru", title: "Down the coast, into the highlands", image: "/library/maps/price-map-6-peru.webp", kind: "Published route map · Map VI", source: "Nutrition and Physical Degeneration · Map VI, Peru", local: "NPD 300_Map_6.tiff", aspect: 1323 / 1683, url: priceBookSource,
    text: "A line comes down from New York through Panama, follows the Pacific coast to Lima and turns inland. Twenty-five stops are numbered, but this sheet carries no legend for them, so they are not named here. The Peru photograph on the globe is tied to the Cusco area by the book’s text, not by this map." },
];

/** Digitized negatives supplied without captions. Only scenes without identifiable people are shown, and nothing is guessed. */
export const openNegatives: StorySheet[] = [
  { id: "sail", title: "A boat without a caption", image: "/library/negatives/negative-img101.webp", kind: "Digitized negative · Shown as a positive", source: "Supplied archive scans · Digitized negatives", local: "Landing/Scanned images/3 - Digitized negatives (positives)/img101.png", aspect: 1400 / 788, url: null,
    text: "A sailing boat on open water, with a dark line of hills behind it. No caption came with this file. The place, the date and the boat are not identified, and this experience does not guess. It is here because an archive also holds what is still waiting to be described." },
  { id: "shore", title: "A shore still to be named", image: "/library/negatives/negative-img025.webp", kind: "Digitized negative · Shown as a positive", source: "Supplied archive scans · Digitized negatives", local: "Landing/Scanned images/3 - Digitized negatives (positives)/other options/img025.png", aspect: 1400 / 788, url: null,
    text: "Palms, a low building and small figures at the edge of the water, seen from a boat. The location is not identified in the supplied files. Captioning images like this one, with evidence, is part of the work ahead." },
];

export const sheetSets = { maps: routeMaps, negatives: openNegatives } as const;
export type SheetSetId = keyof typeof sheetSets;
export const sheetLabels: Record<SheetSetId, { noun: string; station: string }> = { maps: { noun: "MAP", station: "The route maps" }, negatives: { noun: "NEGATIVE", station: "The uncaptioned negatives" } };

/** Where the visitor stands to reach the things that are not on the table. */
export const storyStations = {
  maps: { label: "The route maps", point: { x: -2.3, z: -.35 }, look: [-3.65, 1.55, -.4] },
  negatives: { label: "The uncaptioned negatives", point: { x: 2.4, z: .8 }, look: [3.17, .6, .75] },
} as const;

/** The framed portrait in the study moves; the note says plainly that the movement is generated. */
export const livingPortrait = {
  title: "A portrait that moves",
  text: "This frame holds the supplied portrait of Price, set in motion with an AI tool: a blink, a slight smile. The movement is generated. It is not film of Price, and nothing here records how he moved or spoke. The original photograph is in the plate cabinet, unchanged; its photographer and date have not been confirmed.",
  action: "Hold the original photograph",
  video: "/cinematic/home/price-living-portrait.mp4",
  station: { label: "The living portrait", point: { x: 2.35, z: 1.3 }, look: [3.65, 1.75, 1.2] },
} as const;

/** The loaf and cheese are modelled; the account they point to is Price's, checked against chapter 3 of his book. */
export const ryeTable = {
  text: "Price writes that food in the Lötschental consisted largely of whole rye bread and summer-made cheese, eaten with fresh milk from goats or cows, with meat about once a week. He describes rye thrashed by hand and ground in stone mills, and households taking turns at a community bake-oven, where a month’s bread was baked at one time. This loaf and cheese were modelled for the room. They are not objects from the archive, and his account is history, not dietary advice.",
  action: "See the mill and the oven in Figure 2",
} as const;
