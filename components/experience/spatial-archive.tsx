/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "@/lib/maplibre";
import type { StyleSpecification } from "@/lib/maplibre";
import { ArrowLeft, ArrowRight, GlobeHemisphereWest, MapTrifold, ArrowsClockwise, Pause } from "@phosphor-icons/react";
import { regions, studies } from "@/lib/experience/content";
import styles from "./immersion.module.css";

// Close regional records share one world-scale photo stack; each remains in the destination rail.
const groups = Array.from(new Set(regions.map(region => region.country))).map(country => ({ country, indices: regions.flatMap((region,index) => region.country === country ? [index] : []), photos: regions.filter(region => region.country === country).flatMap(region => region.photos) }));
const photoCount = new Set(regions.flatMap(region => region.photos)).size;

const satellite: StyleSpecification = {
  version: 8,
  sources: { satellite: { type: "raster", tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg"], tileSize: 256, maxzoom: 13, attribution: 'Sentinel-2 cloudless © <a href="https://s2maps.eu">EOX</a>' } },
  layers: [{ id: "satellite", type: "raster", source: "satellite", paint: { "raster-saturation": -.45, "raster-brightness-max": .8, "raster-fade-duration": 500 } }],
};

export function SpatialArchive({ motion, onPhoto, initialPhoto, onReturn, bookmark }: { motion: boolean; onPhoto: (index: number) => void; initialPhoto?: number; onReturn: () => void; bookmark: string }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pins = useRef<HTMLButtonElement[]>([]);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [selected, setSelected] = useState<number | null>(() => { const index = regions.findIndex(region => region.photos.includes(initialPhoto ?? -1)); return index < 0 ? null : index; });
  const [orbit, setOrbit] = useState(false);
  const returnButton = useRef<HTMLButtonElement>(null);
  const [layer, setLayer] = useState<"satellite" | "atlas">("satellite");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => { returnButton.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const index = regions.findIndex(region => region.photos.includes(initialPhoto ?? -1));
    if (index >= 0) setSelected(index);
  }, [initialPhoto]);

  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map | undefined;
    let ready = false;
    const timeout = setTimeout(() => { if (!ready) setStatus("error"); }, 15000);
    try {
      instance = new maplibregl.Map({ container: container.current, style: satellite, center: [-130, 10], zoom: window.innerWidth > 700 ? 1.9 : .85, minZoom: 0, maxZoom: 9, attributionControl: { compact: true }, canvasContextAttributes: { antialias: true } });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
      instance.on("style.load", () => {
        instance?.setProjection({ type: "globe" });
        instance?.setSky({ "sky-color": "#091510", "horizon-color": "#b4c7ba", "fog-color": "#b8c7bd", "atmosphere-blend": .7 });
      });
      instance.on("load", () => { ready = true; clearTimeout(timeout); setStatus("ready"); instance?.resize(); });
      instance.on("error", () => { if (!ready) setStatus("error"); });
      instance.on("dragstart", () => setOrbit(false));
      instance.on("zoomstart", event => { if (event.originalEvent) setOrbit(false); });
      pins.current = groups.map(group => {
        const region = regions[group.indices[0]];
        const marker = document.createElement("button");
        marker.type = "button"; marker.className = styles.mapPhotoPin;
        marker.setAttribute("aria-label", `Explore ${group.country}, ${group.photos.length} ${group.photos.length === 1 ? "photograph" : "photographs"}`);
        marker.setAttribute("aria-pressed", "false");
        const image = document.createElement("img"); image.src = studies[region.photo].image; image.alt = "";
        const label = document.createElement("span"); label.textContent = group.country;
        const count = document.createElement("b"); count.className = styles.pinCount; count.textContent = String(group.photos.length);
        marker.append(image, label, count);
        marker.addEventListener("click", () => { setOrbit(false); setSelected(current => current !== null && group.indices.includes(current) ? current : group.indices[0]); });
        markers.current.push(new maplibregl.Marker({ element: marker, anchor: "bottom", offset: [0, -24] }).setLngLat(region.center).addTo(instance!));
        return marker;
      });
    } catch { queueMicrotask(() => setStatus("error")); }
    const resize = new ResizeObserver(() => instance?.resize()); resize.observe(container.current);
    return () => { clearTimeout(timeout); resize.disconnect(); instance?.remove(); map.current = null; pins.current = []; markers.current = []; };
  }, [retry]);

  useEffect(() => {
    if (status !== "ready") return;
    const duration = motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 2600 : 0;
    pins.current.forEach((pin,index) => { const chosen = selected !== null && groups[index].indices.includes(selected); pin.setAttribute("aria-pressed", String(chosen)); markers.current[index]?.setLngLat(regions[chosen ? selected! : groups[index].indices[0]].center); });
    if (selected === null) map.current?.flyTo({ center: [-130, 10], zoom: window.innerWidth > 700 ? 1.9 : .85, pitch: 0, bearing: 0, padding: {top: 0, right: 0, bottom: 0, left: 0}, duration });
    else {
      const region = regions[selected];
      map.current?.flyTo({ center: region.center, zoom: region.zoom, pitch: 30, bearing: selected === 1 ? -15 : 18, duration, padding: window.innerWidth > 700 ? { top: 100, right: 370, bottom: 140, left: 40 } : { top: 120, right: 0, bottom: 340, left: 0 } });
    }
  }, [selected, status, motion]);

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

  function changeLayer(value: "satellite" | "atlas") {
    if (value === layer) return;
    setLayer(value);
    map.current?.setStyle(value === "satellite" ? satellite : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
  }

  return <section className={`${styles.globe} ${styles.fullscreenGlobe}`} aria-label="Photographic atlas" data-testid="fullscreen-atlas" data-selected={selected !== null}>
    <div ref={container} className={styles.globeCanvas} aria-label="Interactive globe with historical photographs from Europe, the Pacific and Peru" />
    <header className={styles.atlasNavigation}><button ref={returnButton} onClick={onReturn}><ArrowLeft size={20} /><span>Return to documentary<small>{bookmark}</small></span></button><div>THE PHOTOGRAPHIC ATLAS<small>{photoCount} photographs · {regions.length} places · Your own path</small></div></header>
    {status !== "ready" && <div className={styles.globeLoading} role="status"><div>{status === "loading" ? "Opening a window onto the world…" : "The globe could not connect. The photographs are still available below."}{status === "error" && <button className={styles.worldButton} onClick={() => { setStatus("loading"); setLayer("satellite"); setRetry(retry + 1); }}>Try the globe again</button>}</div></div>}
    <div className={styles.globeHeader}><div className={styles.globeModes}><button aria-pressed={layer === "satellite"} onClick={() => changeLayer("satellite")}><GlobeHemisphereWest size={15} /> Satellite</button><button aria-pressed={layer === "atlas"} onClick={() => changeLayer("atlas")}><MapTrifold size={15} /> Atlas</button></div><button className={styles.worldButton} aria-pressed={orbit} onClick={() => { setSelected(null); setOrbit(!orbit); }}>{orbit ? <Pause size={16}/> : <ArrowsClockwise size={16}/>} Orbit</button><button className={styles.worldButton} onClick={() => { setOrbit(false); setSelected(null); map.current?.flyTo({ center: [-130, 10], zoom: window.innerWidth > 700 ? 1.9 : .85, pitch: 0, bearing: 0, padding: {top: 0, right: 0, bottom: 0, left: 0}, duration: motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 2200 : 0 }); }}><GlobeHemisphereWest size={17} /> Whole world</button></div>
    {selected === null && <div className={styles.globeIntro}><span>ANOTHER WAY TO WANDER</span><h3>A world of<br /><em>connections.</em></h3><p>Turn the globe. Choose a photograph. Let a place become the beginning of a story.</p></div>}
    {selected !== null && <aside className={styles.selectedPlace}><img src={studies[regions[selected].photo].image} alt={studies[regions[selected].photo].alt} /><span>Historical photographs / {regions[selected].country}</span><h3>{regions[selected].name}</h3><p>{regions[selected].text}</p><small>{regions[selected].precision}</small><button onClick={() => onPhoto(regions[selected].photo)}>Step inside the photograph <ArrowRight size={19} /></button><div className={styles.placeThumbnails}>{regions.filter(region => region.country === regions[selected].country).flatMap(region => region.photos.map(photo=><button key={photo} onClick={()=>onPhoto(photo)} aria-label={`Open photograph: ${studies[photo].title}`}><img src={studies[photo].image} alt=""/><span>{region.name}</span></button>))}</div></aside>}
    <nav className={styles.globeRail} aria-label="Photographic destinations">{regions.map((region, index) => <button key={region.id} aria-label={`Visit ${region.name}, ${region.country}`} aria-pressed={selected === index} onClick={() => { setOrbit(false); setSelected(index); }}><img src={studies[region.photo].image} alt="" /><span>0{index + 1} / {region.country}<strong>{region.name}</strong><small>{region.photos.length} {region.photos.length === 1 ? "photograph" : "photographs"}</small></span></button>)}</nav>
    <span className={styles.globeNote}>{photoCount} historical photographs · Source-linked places · Locations are regional references</span>
  </section>;
}
