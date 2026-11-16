"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "@/lib/maplibre";
import { regions } from "@/lib/experience/content";
import styles from "./experience.module.css";

export function RegionMap({ motion = true }: { motion?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: [-100, 67], zoom: 1.8, minZoom: 1, maxZoom: 6,
        attributionControl: { compact: true },
      });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      instance.on("load", () => { setStatus("ready"); instance.resize(); });
      instance.on("error", () => setStatus((previous) => previous === "ready" ? previous : "error"));
      regions.forEach((region, index) => {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = styles.mapMarker;
        marker.textContent = String(index + 1).padStart(2, "0");
        marker.setAttribute("aria-label", `Explore ${region.name}`);
        marker.addEventListener("click", () => setSelected(index));
        new maplibregl.Marker({ element: marker }).setLngLat(region.center).addTo(instance);
      });
    } catch {
      // Synchronize the visible fallback with a failed external WebGL constructor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error"); return;
    }
    const resize = new ResizeObserver(() => instance.resize());
    resize.observe(container.current);
    return () => { resize.disconnect(); instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const region = regions[selected];
    map.current?.flyTo({ center: region.center, zoom: region.zoom, duration: !motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1600 });
  }, [selected, status, motion]);

  return <div className={styles.mapLayout}>
    <div className={styles.mapCanvas} ref={container} aria-label="Interactive map of the northern regions">
      {status !== "ready" && <div className={styles.mapStatus} role="status">{status === "loading" ? "Opening the northern landscape…" : "The map could not connect. You can still explore the regions below."}</div>}
    </div>
    <aside className={styles.mapNotes}>
      <span className={styles.eyebrow}>Geographic context</span>
      <h3>A world around<br />the photographs.</h3>
      <div className={styles.regionButtons}>{regions.map((region, index) => <button key={region.name} aria-pressed={selected === index} onClick={() => setSelected(index)}><span>0{index + 1}</span>{region.name}</button>)}</div>
      <p>{regions[selected].text}</p>
      <small>These regions provide orientation, not a verified itinerary. The study images are not assigned to these locations.</small>
    </aside>
  </div>;
}
