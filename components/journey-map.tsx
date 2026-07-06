"use client";

import Link from "next/link";
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { JourneyProject } from "@/lib/data/schema";
import { useJourneyMapStore } from "@/lib/state/journey-map-store";

type Props = {
  project: JourneyProject;
};

type MarkerRef = {
  marker: maplibregl.Marker;
  button: HTMLButtonElement;
  coords: [number, number];
};

export function JourneyMap({ project }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, MarkerRef>>({});
  const selectedExpeditionId = useJourneyMapStore((state) => state.selectedExpeditionId);
  const setSelectedExpeditionId = useJourneyMapStore((state) => state.setSelectedExpeditionId);

  const selectedExpedition = useMemo(
    () => project.expeditions.find((expedition) => expedition.id === selectedExpeditionId),
    [project.expeditions, selectedExpeditionId],
  );

  const countryById = useMemo(
    () => new Map(project.countries.map((country) => [country.id, country.name])),
    [project.countries],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 20],
      zoom: 1.3,
      minZoom: 1.1,
      maxZoom: 6,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

    for (const expedition of project.expeditions) {
      const stop = expedition.stops[0];
      if (!stop) {
        continue;
      }

      const markerButton = document.createElement("button");
      markerButton.type = "button";
      markerButton.className = "map-marker-btn";
      markerButton.innerHTML = `<span class="map-marker-btn__dot"></span><span class="map-marker-btn__year">${expedition.yearStart}</span>`;
      markerButton.onclick = () => setSelectedExpeditionId(expedition.id);

      const coords: [number, number] = [stop.lng, stop.lat];
      const marker = new maplibregl.Marker({
        element: markerButton,
        anchor: "bottom",
      })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current[expedition.id] = { marker, button: markerButton, coords };
    }

    return () => {
      for (const entry of Object.values(markersRef.current)) {
        entry.marker.remove();
      }
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, [project.expeditions, setSelectedExpeditionId]);

  useEffect(() => {
    for (const [expeditionId, entry] of Object.entries(markersRef.current)) {
      entry.button.classList.toggle("is-active", expeditionId === selectedExpeditionId);
    }

    if (!selectedExpeditionId) {
      return;
    }

    const selected = markersRef.current[selectedExpeditionId];
    if (!selected || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: selected.coords,
      zoom: Math.max(2.4, mapRef.current.getZoom()),
      duration: 700,
      essential: true,
    });
  }, [selectedExpeditionId]);

  return (
    <section className={`journey-layout panel ${selectedExpedition ? "has-open-sidebar" : ""}`}>
      <div className="journey-map">
        <h2 className="section-title">Journey Map</h2>
        <p className="meta">
          Tap a journey on the map to open its chapter in the sidebar.
        </p>

        <div ref={mapContainerRef} className="journey-map__surface" />

        <div className="journey-map__legend">
          {project.expeditions.map((expedition) => (
            <button
              key={expedition.id}
              type="button"
              className={`chip journey-map__chip ${selectedExpeditionId === expedition.id ? "is-active" : ""}`}
              onClick={() => setSelectedExpeditionId(expedition.id)}
            >
              {expedition.title}
            </button>
          ))}
        </div>
      </div>

      <aside className={`journey-sidebar ${selectedExpedition ? "is-open" : ""}`}>
        {selectedExpedition ? (
          <>
            <div className="row">
              <h3 className="section-title">Expedition Chapter</h3>
              <button
                type="button"
                className="journey-sidebar__close"
                onClick={() => setSelectedExpeditionId(null)}
              >
                Close
              </button>
            </div>
            <article className="card">
              <p className="card__title">{selectedExpedition.title}</p>
              <p className="meta">{selectedExpedition.summary}</p>
              <div className="chip-row">
                <span className="chip">{selectedExpedition.dateLabel}</span>
                {selectedExpedition.countries.map((countryId) => (
                  <span className="chip" key={countryId}>
                    {countryById.get(countryId) ?? countryId}
                  </span>
                ))}
              </div>
            </article>

            <h4 className="section-title space-top">Stops</h4>
            <ul className="list">
              {selectedExpedition.stops.map((stop) => (
                <li className="card" key={stop.id}>
                  <p className="card__title">{stop.name}</p>
                  <p className="meta">
                    {countryById.get(stop.countryId)} &middot; {stop.artifactIds.length} artifacts
                  </p>
                </li>
              ))}
            </ul>

            <Link href={`/chapters/${selectedExpedition.id}`} className="journey-sidebar__link">
              Open full chapter &rarr;
            </Link>
          </>
        ) : (
          <div className="journey-sidebar__empty">
            <h3 className="section-title">Sidebar</h3>
            <p className="meta">
              Select a journey on the map to see its chapter.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}
