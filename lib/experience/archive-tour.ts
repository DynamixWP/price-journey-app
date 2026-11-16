/** The guided atlas follows the displayed collection order, not a claimed historical itinerary. */
export function narratedRoute<T extends { id: string; image: number }>(photos: number[], details: T[]): T[] {
  return photos.flatMap(photo => details.filter(detail => detail.image === photo));
}

export function nextNarratedStop<T extends { id: string }>(route: T[], id: string): T | undefined {
  const index = route.findIndex(stop => stop.id === id);
  return index >= 0 ? route[index + 1] : undefined;
}

/** Portraits and intact plates keep their own image bounds, so pins use image coordinates. */
export function containedPhotoFrame(width: number, height: number, aspect: number, focus: [number, number], zoom: number) {
  const mobile = width <= 700;
  const area = mobile ? { x: 0, width, height: height * .57 } : { x: width * .41, width: width * .59, height };
  const imageHeight = Math.min(area.height, area.width / aspect);
  const imageWidth = imageHeight * aspect;
  const baseX = area.x + (area.width - imageWidth) / 2;
  const baseY = (area.height - imageHeight) / 2;
  const constrain = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const x = constrain(area.x + area.width * .5 - imageWidth * zoom * focus[0] / 100, baseX - imageWidth * (zoom - 1), baseX);
  const y = constrain(area.height * .43 - imageHeight * zoom * focus[1] / 100, baseY - imageHeight * (zoom - 1), baseY);
  return { imageWidth, imageHeight, x, y, zoom };
}
