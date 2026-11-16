export type StoryBeat = {
  image: number; start: number; label: string; title: string; text: string;
  hotspot?: string; focus: [number, number]; zoom: number; side: "left" | "right";
};

// The documentary uses supplied historical images. Arctic concepts live separately.
export const storyBeats: StoryBeat[] = [
  {
    "image": 3,
    "start": 0,
    "label": "Prologue / Weston A. Price",
    "title": "A life\nof looking.",
    "text": "A researcher. A camera. A world of questions. His journeys became Nutrition and Physical Degeneration, published in 1939.",
    "focus": [
      50,
      50
    ],
    "zoom": 1,
    "side": "left"
  },
  {
    "image": 4,
    "start": 0.125,
    "label": "01 / Switzerland · Fieldwork, 1931–1932",
    "title": "A valley.\nA way of life.",
    "text": "Lötschental. Price arrived in the summer of 1931 and returned to Switzerland the following year. This landscape opens his Swiss chapter.",
    "focus": [
      51,
      48
    ],
    "zoom": 1,
    "side": "left",
    "hotspot": "church"
  },
  {
    "image": 4,
    "start": 0.25,
    "label": "Switzerland / The people behind the journey",
    "title": "A church.\nA connection.",
    "text": "Price credits the local pastor, Reverend John Siegen, with helping his work in the valley. A journey made possible by people who lived here.",
    "focus": [
      61,
      66
    ],
    "zoom": 1.7,
    "side": "left",
    "hotspot": "church"
  },
  {
    "image": 4,
    "start": 0.375,
    "label": "Switzerland / Reading the landscape",
    "title": "Between forest\nand village.",
    "text": "His account describes rye, hay and forests protected against falling snow and rock. The landscape held the rhythms of daily work.",
    "focus": [
      36,
      58
    ],
    "zoom": 1.5,
    "side": "right",
    "hotspot": "landscape"
  },
  {
    "image": 5,
    "start": 0.5,
    "label": "02 / Aotearoa New Zealand · Figure 68",
    "title": "Another place.\nAnother story.",
    "text": "Rotorua Dental Clinic. The words on the wall connect this photograph to a place on the other side of the world.",
    "focus": [
      50,
      50
    ],
    "zoom": 1,
    "side": "right",
    "hotspot": "sign"
  },
  {
    "image": 5,
    "start": 0.625,
    "label": "New Zealand / A public service",
    "title": "A small building.\nA wider ambition.",
    "text": "New Zealand’s School Dental Service began in 1921. Thirty women entered its first training programme in Wellington.",
    "focus": [
      40,
      40
    ],
    "zoom": 1.65,
    "side": "right",
    "hotspot": "sign"
  },
  {
    "image": 5,
    "start": 0.75,
    "label": "New Zealand / The people in the frame",
    "title": "Look at\nwho is here.",
    "text": "Price identifies Colonel Saunders and a dental operator. Her name is absent from this passage. The photograph leaves more to discover.",
    "focus": [
      34,
      73
    ],
    "zoom": 1.65,
    "side": "right",
    "hotspot": "people"
  },
  {
    "image": 4,
    "start": 0.875,
    "label": "Epilogue / Follow your curiosity",
    "title": "Every detail.\nA way into history.",
    "text": "Two photographs, connected to places, people and sources. Travel into the globe, then return to the story exactly where you left it.",
    "focus": [
      58,
      58
    ],
    "zoom": 1.05,
    "side": "left",
    "hotspot": "church"
  }
];
export const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
export function beatAt(progress: number) {
  let index = 0;
  storyBeats.forEach((beat, i) => { if (progress >= beat.start) index = i; });
  return index;
}

/** Cover an image, put a focal point beside the copy, and never expose its edges. */
export function cameraFrame(width: number, height: number, focus: [number, number], zoom: number, side: "left" | "right", aspect = 1536 / 1024) {
  const imageWidth = Math.max(width, height * aspect);
  const imageHeight = imageWidth / aspect;
  const targetX = width * (width < 700 ? .5 : side === "left" ? .67 : .34);
  const targetY = height * (width < 700 ? .39 : .53);
  const x = clamp(targetX - focus[0] / 100 * imageWidth * zoom, width - imageWidth * zoom, 0);
  const y = clamp(targetY - focus[1] / 100 * imageHeight * zoom, height - imageHeight * zoom, 0);
  return { imageWidth, imageHeight, x, y, zoom };
}
