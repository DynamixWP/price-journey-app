/**
 * The atlas has its own look: paper, ink and soft relief, in the spirit of the hand-drawn maps in Price's book.
 * It is a restyling of a published basemap, so coastlines, borders and names stay those of the map provider.
 */
export const atlasBaseUrl = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
export const atlasInk = { paper: "#eadfc4", paperShade: "#dccfae", sea: "#a9b9ad", seaInk: "#56705f", ink: "#3b3226", inkSoft: "#75654b", line: "#b3a37f" } as const;

/** Public elevation tiles (Terrarium encoding). They give the valley its real relief and the paper atlas its shading. */
export const demSource = {
  type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 13, encoding: "terrarium",
  attribution: 'Elevation: <a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles</a> (Mapzen, AWS Open Data)',
} as const;

type Layer = { id: string; type: string; source?: string; "source-layer"?: string; paint?: Record<string, unknown>; layout?: Record<string, unknown>; [key: string]: unknown };
type Style = { layers: Layer[]; sources: Record<string, unknown>; sprite?: unknown; [key: string]: unknown };

/** Meridians and parallels every fifteen degrees, as on a printed atlas. */
export function graticule(step = 15) {
  const features: { type: "Feature"; properties: { kind: string }; geometry: { type: "LineString"; coordinates: [number, number][] } }[] = [];
  for (let longitude = -180; longitude < 180; longitude += step) features.push({ type: "Feature", properties: { kind: "meridian" }, geometry: { type: "LineString", coordinates: Array.from({ length: 35 }, (_, index) => [longitude, -85 + index * 5] as [number, number]) } });
  for (let latitude = -75; latitude <= 75; latitude += step) features.push({ type: "Feature", properties: { kind: latitude === 0 ? "equator" : "parallel" }, geometry: { type: "LineString", coordinates: Array.from({ length: 73 }, (_, index) => [-180 + index * 5, latitude] as [number, number]) } });
  return { type: "FeatureCollection" as const, features };
}

/**
 * Turn a published basemap style into the paper atlas. Geometry, filters and zoom ranges are left untouched;
 * only colours, lettering and the decorative layers change. Buildings, points of interest and icons are removed.
 */
export function paperAtlas<T extends Style>(base: T): T {
  const layers: Layer[] = [];
  for (const original of base.layers) {
    const layer: Layer = { ...original, paint: { ...(original.paint ?? {}) }, layout: { ...(original.layout ?? {}) } }, kind = layer["source-layer"];
    if (kind === "buildings" || kind === "pois") continue;
    if (layer.type === "background") layer.paint = { "background-color": atlasInk.paper };
    else if (layer.type === "fill") {
      if (kind === "water") layer.paint = { "fill-color": atlasInk.sea };
      else layer.paint = { "fill-color": atlasInk.paperShade, "fill-opacity": .32 };
    } else if (layer.type === "line") {
      const width = layer.paint!["line-width"];
      if (kind === "boundaries") layer.paint = { "line-color": atlasInk.inkSoft, "line-dasharray": [4, 3], "line-opacity": .7, "line-width": ["interpolate", ["linear"], ["zoom"], 1, .4, 6, .9, 11, 1.5] };
      else if (kind === "water") layer.paint = { "line-color": atlasInk.seaInk, "line-opacity": .55, ...(width === undefined ? {} : { "line-width": width }) };
      else layer.paint = { "line-color": atlasInk.line, "line-opacity": .45, ...(width === undefined ? {} : { "line-width": width }) };
    } else if (layer.type === "symbol") {
      const layout = layer.layout!; delete layout["icon-image"];
      if (layout["text-field"] === undefined) continue;
      const water = kind === "water", country = /country|continent/.test(layer.id);
      // The provider's own font stacks are kept: single faces are not all served by its glyph endpoint.
      if (country) { layout["text-transform"] = "uppercase"; layout["text-letter-spacing"] = .28; }
      layer.paint = { "text-color": water ? atlasInk.seaInk : atlasInk.ink, "text-halo-color": water ? atlasInk.sea : atlasInk.paper, "text-halo-width": 1.3, "text-opacity": country ? .9 : .78 };
    }
    layers.push(layer);
  }
  // Relief is drawn on the land and hidden by the sea; the graticule lies over both, under the lettering.
  const water = layers.findIndex(layer => layer.type === "fill" && layer["source-layer"] === "water"), relief: Layer = { id: "paper-relief", type: "hillshade", source: "dem", paint: { "hillshade-shadow-color": "#6d5a3e", "hillshade-highlight-color": "#fff9e8", "hillshade-accent-color": "#8c7856", "hillshade-exaggeration": .42 } };
  layers.splice(water < 0 ? 1 : water, 0, relief);
  const lettering = layers.findIndex(layer => layer.type === "symbol"), lines: Layer = { id: "paper-graticule", type: "line", source: "graticule", paint: { "line-color": atlasInk.inkSoft, "line-opacity": ["match", ["get", "kind"], "equator", .5, .2], "line-width": ["match", ["get", "kind"], "equator", .9, .5] } };
  layers.splice(lettering < 0 ? layers.length : lettering, 0, lines);
  const style = { ...base, layers, sources: { ...base.sources, dem: demSource, terrain: demSource, graticule: { type: "geojson", data: graticule() } } };
  delete (style as Style).sprite;
  return style;
}
