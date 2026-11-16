"use client";

import Link from "next/link";
import * as maplibregl from "@/lib/maplibre";
import { type GeoJSONSource, LngLatBounds } from "@/lib/maplibre";
import { useEffect, useMemo, useRef, useState } from "react";
import type { JourneyProject } from "@/lib/data/schema";
import { archiveImages, imageForExpedition } from "@/lib/visuals";
import styles from "@/app/concept/concept.module.css";

type Props = { project: JourneyProject };

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const COLORS = ["#a83e24", "#b0793b", "#6d8065", "#94725a", "#a1523f", "#78856d"];
const journalImages = [
  "/archive-concepts/cherbourg-harbor-recreation.png",
  "/archive-concepts/field-car-recreation.png",
  archiveImages.alpine,
  archiveImages.arctic,
  archiveImages.pacific,
];

export function ConceptExplorer({ project }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [expeditionIndex, setExpeditionIndex] = useState(0);
  const [stopIndex, setStopIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const expedition = project.expeditions[expeditionIndex];
  const stop = expedition.stops[stopIndex] ?? expedition.stops[0];
  const color = COLORS[expeditionIndex % COLORS.length];
  const heroImage = imageForExpedition(expedition);
  const countryNames = useMemo(() => new Map(project.countries.map((country) => [country.id, country.name])), [project.countries]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const instance = new maplibregl.Map({ container: mapContainer.current, style: MAP_STYLE, center: [5, 26], zoom: 1.35, minZoom: 1, maxZoom: 7, attributionControl: false });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    instance.on("load", () => setMapReady(true));
    map.current = instance;
    return () => { instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStopIndex((current) => {
      if (current >= expedition.stops.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 2200);
    return () => window.clearInterval(timer);
  }, [expedition.stops.length, playing]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    const coordinates = expedition.stops.map((item) => [item.lng, item.lat]);
    const route = { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates } };
    const points = { type: "FeatureCollection" as const, features: expedition.stops.map((item, index) => ({ type: "Feature" as const, properties: { active: index === stopIndex ? 1 : 0 }, geometry: { type: "Point" as const, coordinates: [item.lng, item.lat] } })) };
    if (instance.getSource("concept-route")) {
      (instance.getSource("concept-route") as GeoJSONSource).setData(route);
      (instance.getSource("concept-stops") as GeoJSONSource).setData(points);
      instance.setPaintProperty("concept-route-line", "line-color", color);
      instance.setPaintProperty("concept-route-glow", "line-color", color);
      instance.setPaintProperty("concept-stops-circle", "circle-color", color);
    } else {
      instance.addSource("concept-route", { type: "geojson", data: route });
      instance.addLayer({ id: "concept-route-glow", type: "line", source: "concept-route", paint: { "line-color": color, "line-width": 8, "line-opacity": .18, "line-blur": 5 } });
      instance.addLayer({ id: "concept-route-line", type: "line", source: "concept-route", paint: { "line-color": color, "line-width": 3, "line-opacity": .96, "line-dasharray": [1, 1.25] } });
      instance.addSource("concept-stops", { type: "geojson", data: points });
      instance.addLayer({ id: "concept-stops-circle", type: "circle", source: "concept-stops", paint: { "circle-radius": ["case", ["==", ["get", "active"], 1], 12, 6], "circle-color": color, "circle-stroke-color": "#f8f1e3", "circle-stroke-width": ["case", ["==", ["get", "active"], 1], 4, 2] } });
    }
    if (playing) instance.flyTo({ center: [stop.lng, stop.lat], zoom: 4.2, duration: 1400, essential: true });
    else {
      const bounds = new LngLatBounds();
      coordinates.forEach((coordinate) => bounds.extend(coordinate as [number, number]));
      instance.fitBounds(bounds, { padding: { top: 110, bottom: 170, left: 95, right: 90 }, maxZoom: 4.2, duration: 900 });
    }
  }, [color, expedition, mapReady, playing, stop.lat, stop.lng, stopIndex]);

  const chooseExpedition = (index: number) => { setExpeditionIndex(index); setStopIndex(0); setPlaying(false); };

  return (
    <div className={`${styles.atlas} atlas-home`} style={{ "--journey-color": color } as React.CSSProperties}>
      <div className={styles.map} ref={mapContainer} aria-label="Interactive expedition map" />
      <div className={styles.mapTint} />
      <aside className={styles.chapterRail} aria-label="Expedition chapters">
        {project.expeditions.map((item, index) => <button type="button" key={item.id} className={`${styles.chapterButton} ${index === expeditionIndex ? styles.chapterActive : ""}`} onClick={() => chooseExpedition(index)} aria-label={`Open ${item.title}`}><span>{String(index + 1).padStart(2, "0")}</span><i /></button>)}
      </aside>
      <section className={styles.storyCard}>
        <div className={styles.storyMeta}><span>Chapter {String(expeditionIndex + 1).padStart(2, "0")}</span><span>{expedition.dateLabel}</span></div>
        <h1>{expedition.title}</h1>
        <figure className={styles.heroPhoto}><img src={heroImage} alt={`Conceptual archival recreation for ${expedition.title}`} /><figcaption>Field photograph · conceptual recreation</figcaption></figure>
        <div className={styles.fieldDesk}>
          <div className={styles.locationLine}><span className={styles.locationDot} /><div><small>Current location</small><strong>{stop.name}</strong><em>{countryNames.get(stop.countryId)}</em></div></div>
          <p><b>Field note · {stop.visitDateLabel ?? expedition.dateLabel}</b>{expedition.summary}</p>
        </div>
        <div className={styles.storyActions}><button type="button" className={styles.playButton} onClick={() => { if (stopIndex === expedition.stops.length - 1) setStopIndex(0); setPlaying((value) => !value); }}>{playing ? "Pause journey" : "View journey"}</button><Link href={`/chapters/${expedition.id}`} className={styles.readLink}>Read field chapter</Link></div>
      </section>
      <section className={styles.stopLabels} aria-label="Route stops">
        {expedition.stops.slice(0, 3).map((item, index) => <button key={item.id} type="button" className={index === stopIndex ? styles.stopLabelActive : ""} onClick={() => { setStopIndex(index); setPlaying(false); }}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.name}</strong><small>{item.visitDateLabel ?? expedition.dateLabel}</small></div></button>)}
      </section>
      <footer className={styles.timeline}>
        <div className={styles.timelineHeading}><span>Route index</span><strong>{expedition.stops.length} field stops</strong></div>
        <div className={styles.timelineTrack}>{expedition.stops.map((item, index) => <button key={item.id} type="button" className={index === stopIndex ? styles.stopActive : ""} onClick={() => { setStopIndex(index); setPlaying(false); }}><img src={journalImages[index % journalImages.length]} alt="" /><span>{item.visitDateLabel ?? expedition.dateLabel}</span><strong>{item.name.split(",")[0]}</strong></button>)}</div>
        <div className={styles.timelineActions}><button type="button" onClick={() => setStopIndex((value) => Math.max(0, value - 1))} disabled={stopIndex === 0}>Previous</button><button type="button" onClick={() => setStopIndex((value) => Math.min(expedition.stops.length - 1, value + 1))} disabled={stopIndex === expedition.stops.length - 1}>Next</button></div>
      </footer>
    </div>
  );
}
