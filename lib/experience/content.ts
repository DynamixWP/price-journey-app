export type StudyImage = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  theme: "Travel" | "Coast" | "Daily life";
  description: string;
  detail: { x: number; y: number; title: string; text: string };
  provenance?: { label: string; file: string; date: string; reference: string; url: string; note: string };
  portrait?: boolean;
  aspect?: number;
};

// These records deliberately do not use WPA IDs or attribute generated images to Price.
// Replace with reviewed archival records, retaining provenance and derivative URLs.
export const studies: StudyImage[] = [
  {
    id: "study-ice", title: "Across the ice", subtitle: "Landscape & movement",
    image: "/archive-concepts/arctic-recreation.png", theme: "Travel",
    alt: "Conceptual monochrome Arctic landscape with a loaded sled and two distant figures.",
    description: "A landscape invites a closer look. The distance between a sled and the horizon becomes a way into questions about travel, seasons, and everyday life.",
    detail: { x: 33, y: 74, title: "Begin with a detail", text: "Look at the layers of equipment on the sled. In the finished archive, a detail like this can open a verified caption, a field note, or a related photograph. This visual study demonstrates that connection." },
  },
  {
    id: "study-coast", title: "Along the shoreline", subtitle: "Water & connection",
    image: "/archive-concepts/arctic-coast-study.png", theme: "Coast",
    alt: "Conceptual monochrome photograph of a wooden boat on a remote Arctic shoreline.",
    description: "A shoreline is both an edge and a connection. Pause at the boat, follow the coast, and consider the journeys that a photograph alone cannot explain.",
    detail: { x: 40, y: 72, title: "The objects in the foreground", text: "A boat can suggest a question about movement or materials. Its actual use, ownership, date, and location must come from the archival record, rather than an interpretation of the image." },
  },
  {
    id: "study-shelter", title: "The spaces of daily life", subtitle: "Place & everyday objects",
    image: "/archive-concepts/arctic-shelter-study.png", theme: "Daily life",
    alt: "Conceptual monochrome photograph of a wooden coastal shelter and everyday objects.",
    description: "Small objects can lead to larger questions. How were resources gathered, stored, and shared? Photographs, community knowledge, and written sources each offer a different kind of evidence.",
    detail: { x: 58, y: 61, title: "Read an image with its sources", text: "An object may be visible while its meaning remains unknown. The archive will distinguish original descriptions, editorial interpretation, and later research, and identify uncertainty where it remains." },
  },
  {
    id: "price-portrait", title: "Weston A. Price", subtitle: "The person behind the archive", theme: "Travel",
    image: "/archive-originals/weston-price-portrait.jpg", portrait: true,
    alt: "Black-and-white portrait of Weston A. Price, wearing glasses and a bow tie, from the supplied project files.",
    description: "A portrait introduces the researcher whose journeys became Nutrition and Physical Degeneration, first published in 1939. The portrait's photographer and date remain to be confirmed.",
    detail: { x: 50, y: 33, title: "Meet the researcher", text: "The supplied portrait is shown as a local archival asset. The book title and 1939 publication date are documented; this photograph's creation date is not assigned." },
    provenance: { label: "Supplied portrait", file: "Landing / NPD 01_1.jpg", date: "Portrait date not confirmed", reference: "Nutrition and Physical Degeneration · first publication, 1939", url: "https://soilandhealth.org/book/nutrition-and-physical-degeneration/", note: "Portrait supplied in the project folder. Identification follows the supplied context; photographer, rights and original catalog record require confirmation." }
  },
  {
    id: "npd-fig-001", title: "Lötschental Valley", subtitle: "Switzerland · Figure 1", theme: "Travel",
    image: "/archive-originals/npd-figure-001.jpg", aspect: 1328 / 728, alt: "Historical photograph of a Swiss mountain valley and village with a church, matching Figure 1 in Price's book.",
    description: "Price's published account describes visits to Switzerland in 1931 and 1932. Figure 1 identifies the Lötschental Valley. These are fieldwork dates, not an asserted exposure date for this photograph.",
    detail: { x: 61, y: 70, title: "A village within the landscape", text: "The church and clustered roofs anchor the foreground of Figure 1. Explore the photograph alongside its published caption and the Swiss fieldwork account." },
    provenance: { label: "Historical photograph", file: "Landing / NPD 300_Fig_001.jpg", date: "Swiss fieldwork: 1931–1932; photo date not assigned", reference: "Nutrition and Physical Degeneration · chapter 3, figure 1", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "Local image visually matched to the published Figure 1. Caption and fieldwork context checked against the book and ANF's reproduction of Price's April 1933 article. Rights and catalog accession remain to be confirmed." }
  },
  {
    id: "npd-fig-068", title: "Rotorua Dental Clinic", subtitle: "New Zealand · Figure 68", theme: "Daily life",
    image: "/archive-originals/npd-figure-068.jpg", aspect: 1328 / 807, alt: "Historical photograph of a wooden building with the sign Rotorua Dental Clinic and two people outside.",
    description: "The building's sign reads Rotorua Dental Clinic. Price's chapter on New Zealand reproduces this photograph as Figure 68 and identifies Colonel Saunders among the people pictured. The man is not presented as Price.",
    detail: { x: 36, y: 39, title: "A name in the photograph", text: "The clinic sign provides a visible connection to Rotorua. Figure 68 and its surrounding text supply historical context; the exact date and original catalog identifier are not assigned here." },
    provenance: { label: "Historical photograph", file: "Landing / NPD 300_Fig_068.jpg", date: "New Zealand; exact photo date not confirmed", reference: "Nutrition and Physical Degeneration · chapter 12, figure 68", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "Local image visually matched to the published Figure 68. The text identifies Colonel Saunders and a dental operator. Rights and catalog accession remain to be confirmed." }
  },
  {
    id: "npd-fig-082", title: "Stonework above Cusco", subtitle: "Peru · Figure 82", theme: "Travel",
    image: "/archive-originals/npd-figure-082.jpg", aspect: 1328 / 1602,
    alt: "Two historical photographs of tightly fitted stone walls, with people standing beside large stones in the upper photograph.",
    description: "The upper image is identified in Price’s text as the wall of Sacsayhuamán above Cusco. The lower image studies the fit of adjoining stones. The original two-image plate is kept together here.",
    detail: { x: 48, y: 29, title: "A human measure of scale", text: "Look at the people beside the stonework in the upper photograph. Their presence gives the wall a human scale. The source identifies Sacsayhuamán for this upper view; the lower detail is not assigned the same exact location." },
    provenance: { label: "Historical photo plate", file: "NPD 300_Fig_082.tiff", date: "Peru; exact photo dates not confirmed", reference: "Nutrition and Physical Degeneration · chapter 13, figure 82", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "Web derivative of the supplied TIFF. The adjacent text identifies Sacsayhuamán for the upper image. The map marks the Cusco area, not a camera position or a separate verified location for the lower image. Original catalog and rights require archive review." }
  },
  {
    id: "npd-fig-035-portrait-1", title: "A portrait from Rarotonga", subtitle: "Cook Islands · Figure 35", theme: "Daily life",
    image: "/archive-originals/npd-figure-035-portrait-1.jpg", aspect: 650 / 737, portrait: true,
    alt: "A close portrait of a woman smiling, from the supplied original crop labelled Figure 35.",
    description: "A person comes into view beyond the map. This supplied crop belongs to Figure 35, whose caption locates its subjects on Rarotonga. Her name and the precise setting are not given in that caption.",
    detail: { x: 50, y: 42, title: "A face, and a name still to find", text: "The published plate connects this portrait with Rarotonga. The record can tell us where to begin looking, while leaving her identity and personal story open for further research." },
    provenance: { label: "Historical photograph · supplied crop", file: "Landing / caras / originales / 05_NPD-fig35.jpg", date: "Rarotonga; exact photo date not confirmed", reference: "Nutrition and Physical Degeneration · chapter 8, figure 35, upper-left portrait", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "Uses the supplied original crop, not the treated version. Figure 35’s caption identifies Rarotonga. Names and exact camera locations are not supplied by that caption; the map is an island-level reference. Original catalog and rights require archive review." }
  },
  {
    id: "npd-fig-035-portrait-2", title: "Another face of Rarotonga", subtitle: "Cook Islands · Figure 35", theme: "Daily life",
    image: "/archive-originals/npd-figure-035-portrait-2.jpg", aspect: 662 / 737, portrait: true,
    alt: "A close portrait of a man smiling, from the supplied original crop labelled Figure 35.",
    description: "A second portrait from the same published plate. It shares the island context of Figure 35, while the sitter’s name and the circumstances of the photograph remain to be established.",
    detail: { x: 51, y: 43, title: "Two portraits, one published plate", text: "Compare this face with the other Rarotonga portrait. The archive preserves their connection within a published figure without treating the two people as interchangeable or assigning a relationship between them." },
    provenance: { label: "Historical photograph · supplied crop", file: "Landing / caras / originales / 06_NPD-fig35.jpg", date: "Rarotonga; exact photo date not confirmed", reference: "Nutrition and Physical Degeneration · chapter 8, figure 35, upper-right portrait", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "Uses the supplied original crop. Figure 35 explicitly places the subjects on Rarotonga, but provides no name or exact camera position for this portrait. Original catalog and rights require archive review." }
  },
  {
    id: "npd-fig-069-portrait-1", title: "A face from the North Island", subtitle: "Aotearoa New Zealand · Figure 69", theme: "Daily life",
    image: "/archive-originals/npd-figure-069-portrait-1.jpg", aspect: 666 / 787, portrait: true,
    alt: "A close portrait of a man smiling, from the supplied original crop labelled Figure 69.",
    description: "One of the portraits published in Figure 69. The chapter identifies its subjects as Māori and describes Price’s fieldwork on the North Island. It does not name this person or locate this portrait in Rotorua.",
    detail: { x: 50, y: 43, title: "Keep the person in the picture", text: "This portrait belongs to the New Zealand chapter. Connecting it to an island gives geographic context; recovering a name, a community and a personal account would add a different kind of knowledge." },
    provenance: { label: "Historical photograph · supplied crop", file: "Landing / caras / originales / 07_NPD-fig69.jpg", date: "New Zealand; exact photo date not confirmed", reference: "Nutrition and Physical Degeneration · chapter 12, figure 69", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "The supplied original crop is labelled Figure 69. The chapter describes Māori subjects and states that its investigations were limited to the North Island. The specific settlement and person are unconfirmed; this photograph is not pinned to Rotorua. Original catalog and rights require archive review." }
  },
  {
    id: "npd-fig-069-portrait-2", title: "Another voice to recover", subtitle: "Aotearoa New Zealand · Figure 69", theme: "Daily life",
    image: "/archive-originals/npd-figure-069-portrait-2.jpg", aspect: 665 / 787, portrait: true,
    alt: "A close portrait of a woman smiling, from the supplied original crop labelled Figure 69.",
    description: "A second supplied portrait from Figure 69 brings another person into the journey. The published context is New Zealand; her name and the original photographic setting remain unconfirmed.",
    detail: { x: 50, y: 44, title: "Beyond the published caption", text: "A caption is one layer of an archive. Personal names and community accounts could connect this photograph to a fuller story. Until then, the record keeps that absence visible." },
    provenance: { label: "Historical photograph · supplied crop", file: "Landing / caras / originales / 08_NPD-fig69.jpg", date: "New Zealand; exact photo date not confirmed", reference: "Nutrition and Physical Degeneration · chapter 12, figure 69", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "Uses the supplied original crop. Geographic context follows Figure 69 and the North Island fieldwork described in chapter 12. No exact village, personal identity or exposure date is assigned. Original catalog and rights require archive review." }
  },
  {
    id: "npd-fig-028-portrait", title: "A portrait from New Caledonia", subtitle: "New Caledonia · Figure 28", theme: "Daily life",
    image: "/archive-originals/npd-figure-028-portrait.jpg", aspect: 657 / 799, portrait: true,
    alt: "A close portrait of a man smiling, from the supplied original crop labelled Figure 28.",
    description: "Figure 28 appears in Price’s account of New Caledonia. This portrait offers another entry into the Pacific photographs, while the sitter’s name and exact location remain open questions.",
    detail: { x: 50, y: 45, title: "An island connection", text: "The paragraph introducing Figure 28 connects these photographs with New Caledonia. That gives the map a regional link, rather than evidence of a particular village or camera position." },
    provenance: { label: "Historical photograph · supplied crop", file: "Landing / caras / originales / 02_NPD-fig28.jpg", date: "New Caledonia; exact photo date not confirmed", reference: "Nutrition and Physical Degeneration · chapter 7, figure 28", url: "https://gutenberg.net.au/ebooks02/0200251h.html", note: "Uses the supplied original crop. The paragraph preceding Figure 28 identifies its subjects with New Caledonia. A regional map reference is used; no name, village or precise camera location is assigned. Original catalog and rights require archive review." }
  },
];

export const regions = [
  { id: "switzerland", name: "Lötschental", country: "Switzerland", photo: 4, photos: [4], center: [7.77, 46.42] as [number, number], zoom: 6.8, precision: "Valley location · camera position unconfirmed", text: "A mountain valley in Valais. Open Figure 1, listen to the stories within it, and see the source behind the photograph." },
  { id: "new-zealand", name: "Rotorua", country: "Aotearoa New Zealand", photo: 5, photos: [5], center: [176.25, -38.14] as [number, number], zoom: 5.4, precision: "City location · original clinic site unconfirmed", text: "The clinic’s sign places Figure 68 in Rotorua. Discover the people in the frame and the story of the School Dental Service." },
  { id: "peru", name: "Cusco", country: "Peru", photo: 6, photos: [6], center: [-71.98, -13.51] as [number, number], zoom: 5.7, precision: "Cusco-area reference · upper image identified as Sacsayhuamán", text: "Enter a study of stone and scale. Figure 82 connects a wall above Cusco with a closer view of fitted masonry." },
  { id: "cook-islands", name: "Rarotonga", country: "Cook Islands", photo: 7, photos: [7, 8], center: [-159.78, -21.23] as [number, number], zoom: 5.2, precision: "Island-level reference · portrait locations unconfirmed", text: "Two portraits from Figure 35 share an island connection. Look closer at each image, and follow the published source." },
  { id: "north-island", name: "North Island", country: "Aotearoa New Zealand", photo: 9, photos: [9, 10], center: [175.5, -38.8] as [number, number], zoom: 4.3, precision: "Island-level context · exact settlements unconfirmed", text: "Two portraits from Figure 69 extend the New Zealand journey beyond the clinic. Their exact places and personal names remain to be recovered." },
  { id: "new-caledonia", name: "New Caledonia", country: "South Pacific", photo: 11, photos: [11], center: [165.6, -21.3] as [number, number], zoom: 4.8, precision: "Regional reference · village and camera position unconfirmed", text: "A portrait from Figure 28 opens another part of the Pacific archive. Its regional context comes from the surrounding account." },
];
