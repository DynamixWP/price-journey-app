/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "@/lib/maplibre";
import type { StyleSpecification } from "@/lib/maplibre";
import { ArrowDown, ArrowLeft, ArrowRight, GlobeHemisphereWest, MapTrifold, ArrowsClockwise, Pause, Play, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import { regions, studies } from "@/lib/experience/content";
import { photoDetails } from "@/lib/experience/photo-details";
import { flightHold, flightStops } from "@/lib/experience/archive-tour";
import { atlasBaseUrl, demSource, paperAtlas } from "@/lib/experience/atlas-style";
import clips from "@/lib/experience/detail-manifest.json";
import styles from "./immersion.module.css";

// Close regional records share one world-scale photo stack; each remains in the destination rail.
const groups = Array.from(new Set(regions.map(region => region.country))).map(country => ({ country, indices: regions.flatMap((region,index) => region.country === country ? [index] : []), photos: regions.filter(region => region.country === country).flatMap(region => region.photos) }));
const photoCount = new Set(regions.flatMap(region => region.photos)).size;
const stops = flightStops(regions, photoDetails);
const valley = regions.findIndex(region => region.id === "switzerland");
const world = { center: [-130, 10] as [number, number], pitch: 0, bearing: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } };
/** A close, tilted view over the valley reference: where a descent ends and where a return from the valley begins. */
const valleyView = { center: regions[valley].center, zoom: 11.3, pitch: 66, bearing: -38 };

const satellite: StyleSpecification = {
  version: 8,
  sources: {
    satellite: { type: "raster", tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg"], tileSize: 256, maxzoom: 13, attribution: 'Sentinel-2 cloudless © <a href="https://s2maps.eu">EOX</a>' },
    terrain: { ...demSource, tiles: [...demSource.tiles] },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite", paint: { "raster-saturation": -.45, "raster-brightness-max": .8, "raster-fade-duration": 500 } }],
};
let paper: Promise<StyleSpecification> | null = null;
/** The paper atlas restyles the published basemap once per visit; if that fails the plain basemap is used instead. */
function loadPaperAtlas() {
  paper ??= fetch(atlasBaseUrl).then(response => { if (!response.ok) throw new Error("Atlas style unavailable"); return response.json(); }).then(base => paperAtlas(base) as unknown as StyleSpecification).catch(error => { paper = null; throw error; });
  return paper;
}

type Props = { motion: boolean; onPhoto: (index: number) => void; initialPhoto?: number; onReturn: () => void; onValley: () => void; onVoice?: (speaking: boolean) => void; rise?: boolean; bookmark: string; returnLabel?: string };

export function SpatialArchive({ motion, onPhoto, initialPhoto, onReturn, onValley, onVoice, rise = false, bookmark, returnLabel = "Return to documentary" }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pins = useRef<HTMLButtonElement[]>([]);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [selected, setSelected] = useState<number | null>(() => { const index = regions.findIndex(region => region.photos.includes(initialPhoto ?? -1)); return index < 0 ? null : index; });
  const [seenPhoto, setSeenPhoto] = useState(initialPhoto);
  const [orbit, setOrbit] = useState(false);
  const returnButton = useRef<HTMLButtonElement>(null);
  const [layer, setLayer] = useState<"satellite" | "atlas">("satellite");
  const currentLayer = useRef(layer), relief = useRef(false), startHigh = useRef(!rise), timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const [flight, setFlight] = useState<{ index: number; playing: boolean } | null>(null);
  const [voice, setVoice] = useState(false), [speaking, setSpeaking] = useState(false), [time, setTime] = useState(0);
  const [descending, setDescending] = useState(false), [veil, setVeil] = useState(false);
  const audio = useRef<HTMLAudioElement>(null), voiceChange = useRef(onVoice);
  const clip = flight ? clips.find(item => item.id === `detail-${stops[flight.index].detail}`) : undefined;
  const still = () => !motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Another photograph asked for from outside (the documentary, the house) selects its place.
  if (seenPhoto !== initialPhoto) { setSeenPhoto(initialPhoto); const index = regions.findIndex(region => region.photos.includes(initialPhoto ?? -1)); if (index >= 0) setSelected(index); }
  useEffect(() => { voiceChange.current = onVoice; }, [onVoice]);
  useEffect(() => { returnButton.current?.focus({ preventScroll: true }); const pending = timers.current; return () => { pending.forEach(clearTimeout); voiceChange.current?.(false); }; }, []);

  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map | undefined;
    let ready = false;
    const timeout = setTimeout(() => { if (!ready) setStatus("error"); }, 15000);
    try {
      const wide = window.innerWidth > 700;
      // Coming back from the valley, the globe starts close above it and rises; otherwise it opens on the whole world.
      instance = new maplibregl.Map({ container: container.current, style: satellite, ...(startHigh.current ? { center: world.center, zoom: wide ? 1.9 : .85 } : valleyView), minZoom: 0, maxZoom: 12.5, maxPitch: 75, attributionControl: { compact: true }, canvasContextAttributes: { antialias: true } });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
      instance.on("style.load", () => {
        const atlas = currentLayer.current === "atlas";
        instance?.setProjection({ type: "globe" });
        instance?.setSky(atlas ? { "sky-color": "#15170f", "horizon-color": "#e3d8bb", "fog-color": "#e9dfc6", "atmosphere-blend": .6 } : { "sky-color": "#091510", "horizon-color": "#b4c7ba", "fog-color": "#b8c7bd", "atmosphere-blend": .7 });
        relief.current = false;
      });
      // Real relief only matters close to the ground, so it is switched on during a descent and off again on the way up.
      instance.on("zoom", () => {
        if (!instance?.getSource("terrain")) return; const wanted = instance.getZoom() > 8.4; if (wanted === relief.current) return;
        try { instance.setTerrain(wanted ? { source: "terrain", exaggeration: 1.25 } : (null as unknown as maplibregl.TerrainSpecification)); relief.current = wanted; } catch { relief.current = false; }
      });
      instance.on("load", () => { ready = true; clearTimeout(timeout); setStatus("ready"); instance?.resize(); });
      instance.on("error", () => { if (!ready) setStatus("error"); });
      instance.on("dragstart", () => { setOrbit(false); setFlight(current => current ? { ...current, playing: false } : current); });
      instance.on("zoomstart", event => { if (event.originalEvent) setOrbit(false); });
      pins.current = groups.map((group, order) => {
        const region = regions[group.indices[0]];
        const marker = document.createElement("button");
        marker.type = "button"; marker.className = styles.mapPhotoPin;
        marker.setAttribute("aria-label", `Explore ${group.country}, ${group.photos.length} ${group.photos.length === 1 ? "photograph" : "photographs"}`);
        marker.setAttribute("aria-pressed", "false");
        const image = document.createElement("img"); image.src = studies[region.photo].image; image.alt = "";
        const label = document.createElement("span"); label.textContent = group.country;
        const count = document.createElement("b"); count.className = styles.pinCount; count.textContent = String(group.photos.length);
        const print = document.createElement("span"); print.className = styles.pinPrint; print.dataset.tilt = String(order % 3); print.append(image, label, count); marker.append(print);
        marker.addEventListener("click", () => { setOrbit(false); setFlight(current => current ? { ...current, playing: false } : current); setSelected(current => current !== null && group.indices.includes(current) ? current : group.indices[0]); });
        markers.current.push(new maplibregl.Marker({ element: marker, anchor: "bottom", offset: [0, -24] }).setLngLat(region.center).addTo(instance!));
        return marker;
      });
    } catch { queueMicrotask(() => setStatus("error")); }
    const resize = new ResizeObserver(() => instance?.resize()); resize.observe(container.current);
    return () => { clearTimeout(timeout); resize.disconnect(); instance?.remove(); map.current = null; pins.current = []; markers.current = []; startHigh.current = true; };
  }, [retry]);

  useEffect(() => {
    if (status !== "ready" || descending) return;
    const instance = map.current, wide = window.innerWidth > 700, animate = motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pins.current.forEach((pin,index) => { const chosen = selected !== null && groups[index].indices.includes(selected); pin.setAttribute("aria-pressed", String(chosen)); markers.current[index]?.setLngLat(regions[chosen ? selected! : groups[index].indices[0]].center); });
    if (!instance) return;
    if (selected === null) { instance.flyTo({ ...world, zoom: wide ? 1.9 : .85, duration: animate ? 2600 : 0 }); return; }
    const region = regions[selected], climb = Math.abs(instance.getZoom() - region.zoom);
    // A long way up from the valley takes longer than a hop between islands.
    instance.flyTo({ center: region.center, zoom: region.zoom, pitch: 30, bearing: selected === 1 ? -15 : 18, duration: animate ? Math.min(5600, 2200 + climb * 620) : 0, padding: wide ? { top: 100, right: 370, bottom: 140, left: 40 } : { top: 120, right: 0, bottom: 340, left: 0 } });
  }, [selected, status, motion, descending]);

  useEffect(() => {
    if (!orbit || selected !== null || status !== "ready" || !motion || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0, last = 0;
    const turn = (time: number) => {
      const instance = map.current;
      if (instance && last && !document.hidden && !instance.isMoving()) { const center = instance.getCenter(); instance.setCenter([center.lng + Math.min(time-last,80) * .002, center.lat]); }
      last = time; frame = requestAnimationFrame(turn);
    };
    frame = requestAnimationFrame(turn);
    return () => cancelAnimationFrame(frame);
  }, [orbit,selected,status,motion]);

  // The guided flight: travel to a place, rest there, move on. With the voice on, it waits for the passage to finish.
  const flightIndex = flight?.index, flying = flight?.playing ?? false, clipId = clip?.id;
  useEffect(() => {
    const node = audio.current;
    if (flightIndex === undefined || !flying) { node?.pause(); return; }
    const pending: ReturnType<typeof setTimeout>[] = [];
    const advance = () => { const next = flightIndex + 1; if (next >= stops.length) { setFlight(null); setSelected(null); } else { setFlight({ index: next, playing: true }); setSelected(next); } };
    if (!voice || !node || !clipId) { pending.push(setTimeout(advance, flightHold(false))); return () => pending.forEach(clearTimeout); }
    const ended = () => pending.push(setTimeout(advance, 2500));
    node.addEventListener("ended", ended);
    pending.push(setTimeout(() => { void node.play().catch(() => pending.push(setTimeout(advance, flightHold(false)))); }, node.currentTime > 0 ? 0 : 2600));
    return () => { pending.forEach(clearTimeout); node.removeEventListener("ended", ended); node.pause(); };
  }, [flightIndex, flying, voice, clipId]);

  function changeLayer(value: "satellite" | "atlas") {
    if (value === layer) return;
    setLayer(value); currentLayer.current = value;
    if (value === "satellite") { map.current?.setStyle(satellite); return; }
    void loadPaperAtlas().then(style => { if (currentLayer.current === "atlas") map.current?.setStyle(style); }).catch(() => { if (currentLayer.current === "atlas") map.current?.setStyle(atlasBaseUrl); });
  }
  function choose(index: number) { setOrbit(false); setFlight(current => current ? { index, playing: false } : current); setSelected(index); }
  function startFlight() { setOrbit(false); setFlight({ index: 0, playing: true }); setSelected(0); }
  function step(change: number) { if (!flight) return; const index = Math.max(0, Math.min(stops.length - 1, flight.index + change)); setFlight({ index, playing: flight.playing }); setSelected(index); }
  function open(photo: number) { setFlight(current => current ? { ...current, playing: false } : current); onPhoto(photo); }
  function wholeWorld() { setOrbit(false); setFlight(null); setSelected(null); map.current?.flyTo({ ...world, zoom: window.innerWidth > 700 ? 1.9 : .85, duration: still() ? 0 : 2200 }); }
  /** From the globe down to the valley: the camera drops over the real relief, the picture dips to dark, and the valley opens. */
  function descend() {
    if (descending) return; setOrbit(false); setFlight(null); setDescending(true);
    const instance = map.current, arrive = () => { setVeil(true); timers.current.push(setTimeout(onValley, still() ? 0 : 950)); };
    if (!instance || still()) { arrive(); return; }
    instance.flyTo({ ...valleyView, duration: 7200, curve: 1.3, essential: true, padding: world.padding });
    instance.once("moveend", () => timers.current.push(setTimeout(arrive, 1200)));
  }
  const place = selected === null ? null : regions[selected];
  const caption = flight && voice && speaking ? clip?.cues.find(cue => time >= cue.start && time < cue.end)?.text : undefined;

  return <section className={`${styles.globe} ${styles.fullscreenGlobe}`} aria-label="Photographic atlas" data-testid="fullscreen-atlas" data-selected={selected !== null} data-layer={layer} data-flight={flight ? (flight.playing ? "playing" : "paused") : "off"} data-flight-index={flight?.index ?? -1} data-descending={descending} data-status={status}>
    <div ref={container} className={styles.globeCanvas} aria-label="Interactive globe with historical photographs from Europe, the Pacific and Peru" />
    <header className={styles.atlasNavigation}><button ref={returnButton} onClick={onReturn}><ArrowLeft size={20} /><span>{returnLabel}<small>{bookmark}</small></span></button><div>THE PHOTOGRAPHIC ATLAS<small>{photoCount} photographs · {regions.length} places · Your own path</small></div></header>
    {status !== "ready" && <div className={styles.globeLoading} role="status"><div>{status === "loading" ? "Opening a window onto the world…" : "The globe could not connect. The photographs are still available below."}{status === "error" && <button className={styles.worldButton} onClick={() => { setStatus("loading"); setLayer("satellite"); currentLayer.current = "satellite"; setRetry(retry + 1); }}>Try the globe again</button>}</div></div>}
    <div className={styles.globeHeader}><div className={styles.globeModes}><button aria-pressed={layer === "satellite"} onClick={() => changeLayer("satellite")}><GlobeHemisphereWest size={15} /> Satellite</button><button aria-pressed={layer === "atlas"} onClick={() => changeLayer("atlas")}><MapTrifold size={15} /> Paper atlas</button></div>{!flight && <button className={`${styles.worldButton} ${styles.flightStart}`} onClick={startFlight} disabled={status !== "ready"}><Play size={15} weight="fill" /> Let the globe guide you</button>}<button className={styles.worldButton} aria-pressed={orbit} onClick={() => { setFlight(null); setSelected(null); setOrbit(!orbit); }}>{orbit ? <Pause size={16}/> : <ArrowsClockwise size={16}/>} Orbit</button><button className={styles.worldButton} onClick={wholeWorld}><GlobeHemisphereWest size={17} /> Whole world</button></div>
    {selected === null && <div className={styles.globeIntro}><span>ANOTHER WAY TO WANDER</span><h3>A world of<br /><em>connections.</em></h3><p>Turn the globe. Choose a photograph. Let a place become the beginning of a story.</p></div>}
    {place && selected !== null && <aside className={styles.selectedPlace}><img src={studies[place.photo].image} alt={studies[place.photo].alt} /><span>Historical photographs / {place.country}</span><h3>{place.name}</h3><p>{place.text}</p><small>{place.precision}</small>{selected === valley && <button className={styles.descend} onClick={descend} disabled={descending}>Descend into the valley <ArrowDown size={19} /></button>}<button onClick={() => open(place.photo)}>Step inside the photograph <ArrowRight size={19} /></button><div className={styles.placeThumbnails}>{regions.filter(region => region.country === place.country).flatMap(region => region.photos.map(photo=><button key={photo} onClick={()=>open(photo)} aria-label={`Open photograph: ${studies[photo].title}`}><img src={studies[photo].image} alt=""/><span>{region.name}</span></button>))}</div></aside>}
    {flight && <div className={styles.flightBar} role="group" aria-label="Guided flight">
      <button className={styles.flightPlay} onClick={() => setFlight({ index: flight.index, playing: !flight.playing })}>{flight.playing ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />} {flight.playing ? "Pause" : "Resume"}</button>
      <button onClick={() => step(-1)} disabled={flight.index === 0} aria-label="Previous place"><ArrowLeft size={16} /></button>
      <span className={styles.flightPlace}>PLACE {flight.index + 1} / {stops.length}<strong>{regions[flight.index].name}</strong></span>
      <button onClick={() => step(1)} disabled={flight.index === stops.length - 1} aria-label="Next place"><ArrowRight size={16} /></button>
      <button aria-pressed={voice} onClick={() => setVoice(!voice)} disabled={!clip}>{voice ? <SpeakerHigh size={16} /> : <SpeakerSlash size={16} />} Voice {voice ? "on" : "off"}</button>
      <p aria-live="polite">{caption ?? "An order for viewing the collection. It is not a route, and not Price’s itinerary."}</p>
      <button onClick={() => setFlight(null)} aria-label="End the guided flight"><X size={16} /> End</button>
      <i className={styles.flightProgress} style={{ width: `${(flight.index + 1) / stops.length * 100}%` }} aria-hidden="true" />
    </div>}
    <nav className={styles.globeRail} aria-label="Photographic destinations">{regions.map((region, index) => <button key={region.id} aria-label={`Visit ${region.name}, ${region.country}`} aria-pressed={selected === index} onClick={() => choose(index)}><img src={studies[region.photo].image} alt="" /><span>0{index + 1} / {region.country}<strong>{region.name}</strong><small>{region.photos.length} {region.photos.length === 1 ? "photograph" : "photographs"}</small></span></button>)}</nav>
    <span className={styles.globeNote}>{photoCount} historical photographs · Source-linked places · Locations are regional references</span>
    {descending && <div className={styles.descentCaption} aria-live="polite"><span>SWITZERLAND / VALAIS</span><strong>Lötschental</strong><small>Real relief around a regional reference. Not a camera position.</small></div>}
    <div className={styles.globeVeil} data-on={veil} aria-hidden="true" />
    {clip && <audio key={clip.id} ref={audio} src={clip.audio} preload="metadata" onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onPlaying={() => { setSpeaking(true); voiceChange.current?.(true); }} onPause={() => { setSpeaking(false); voiceChange.current?.(false); }} onEnded={() => { setSpeaking(false); voiceChange.current?.(false); }} />}
  </section>;
}
