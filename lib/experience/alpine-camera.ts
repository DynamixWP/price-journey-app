export const alpinePoints = [
  { id: "church", title: "A village, a connection", x: .65, y: .64 },
  { id: "landscape", title: "A landscape of daily life", x: .39, y: .78 },
] as const;

/** All plates share a 1536 × 1024 canvas. Hotspots use the village's transform. */
export function alpineFrame(width: number, height: number, progress: number, depth: number, focus: readonly number[] = [.65, .64], detail = 0, pointer = [0, 0]) {
  const p = Math.max(0, Math.min(1, progress));
  const eased = p * p * (3 - 2 * p);
  const scale = Math.max(width / 1536, height / 1024) * (1.04 + eased * .30 * depth + detail * .38 * depth);
  const w = 1536 * scale, h = 1024 * scale;
  const targetX = width < 700 ? .52 : .65;
  const targetY = height < 550 ? .45 : .49;
  const x = width * targetX - w * focus[0] + pointer[0] * 8 * depth;
  const y = height * targetY - h * focus[1] + pointer[1] * 5 * depth;
  return { x: Math.min(0, Math.max(width - w, x)), y: Math.min(0, Math.max(height - h, y)), width: w, height: h };
}
