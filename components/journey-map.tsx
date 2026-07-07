"use client";

import Image from "next/image";
import Link from "next/link";
import maplibregl, { LngLatLike } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { JourneyProject } from "@/lib/data/schema";
import { useJourneyMapStore } from "@/lib/state/journey-map-store";

type Props = {
  project: JourneyProject;
};

type MarkerRef = {
  marker: maplibregl.Marker;
  button: HTMLButtonElement;
  coords: LngLatLike;
  stopId: string;
  expeditionId: string;
};

export function JourneyMap({ project }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<MarkerRef[]>([]);
  const selectedExpeditionId = useJourneyMapStore((state) => state.selectedExpeditionId);
  const setSelectedExpeditionId = useJourneyMapStore((state) => state.setSelectedExpeditionId);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const selectedExpedition = useMemo(
    () => project.expeditions.find((expedition) => expedition.id === selectedExpeditionId),
    [project.expeditions, selectedExpeditionId],
  );

  const countryById = useMemo(
    () => new Map(project.countries.map((country) => [country.id, country.name])),
    [project.countries],
  );
  const selectedStop = useMemo(
    () => selectedExpedition?.stops.find((stop) => stop.id === selectedStopId) ?? selectedExpedition?.stops[0] ?? null,
    [selectedExpedition, selectedStopId],
  );
  const activeStopId = selectedStop?.id ?? null;

  const stopArtifacts = useMemo(() => {
    if (!selectedExpedition || !selectedStop) return [];
    const fromStop = project.artifacts.filter((artifact) => selectedStop.artifactIds.includes(artifact.id));
    if (fromStop.length >= 3) return fromStop.slice(0, 3);
    const fallback = project.artifacts.filter(
      (artifact) =>
        artifact.expeditionIds.includes(selectedExpedition.id) &&
        !fromStop.some((base) => base.id === artifact.id),
    );
    return [...fromStop, ...fallback].slice(0, 3);
  }, [project.artifacts, selectedExpedition, selectedStop]);

  const thumbFor = (id: string) =>
    `https://picsum.photos/seed/${encodeURIComponent(id)}/360/220`;

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
      for (const stop of expedition.stops) {
        const markerButton = document.createElement("button");
        markerButton.type = "button";
        markerButton.className = "map-marker-btn";
        markerButton.innerHTML = `<span class="map-marker-btn__dot"></span><span class="map-marker-btn__year">${stop.visitDateLabel ?? expedition.yearStart}</span>`;
        markerButton.onclick = () => {
          setSelectedExpeditionId(expedition.id);
          setSelectedStopId(stop.id);
        };

        const coords: [number, number] = [stop.lng, stop.lat];
        const marker = new maplibregl.Marker({
          element: markerButton,
          anchor: "bottom",
        })
          .setLngLat(coords)
          .addTo(map);

        markersRef.current.push({
          marker,
          button: markerButton,
          coords,
          stopId: stop.id,
          expeditionId: expedition.id,
        });
      }
    }

    return () => {
      for (const entry of markersRef.current) {
        entry.marker.remove();
      }
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [project.expeditions, setSelectedExpeditionId]);

  useEffect(() => {
    for (const entry of markersRef.current) {
      entry.button.classList.toggle("is-active", entry.stopId === activeStopId);
    }

    if (!activeStopId) {
      return;
    }

    const selected = markersRef.current.find((entry) => entry.stopId === activeStopId);
    if (!selected || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: selected.coords,
      zoom: Math.max(2.4, mapRef.current.getZoom()),
      duration: 700,
      essential: true,
    });
  }, [activeStopId]);

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
              onClick={() => {
                setSelectedExpeditionId(expedition.id);
                setSelectedStopId(expedition.stops[0]?.id ?? null);
              }}
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
                <li
                  className={`card journey-stop-card ${selectedStop?.id === stop.id ? "is-active" : ""}`}
                  key={stop.id}
                >
                  <button
                    type="button"
                    className="journey-stop-card__button"
                    onClick={() => setSelectedStopId(stop.id)}
                  >
                    <p className="card__title">{stop.name}</p>
                  </button>
                  <p className="meta">
                    {stop.visitDateLabel ?? selectedExpedition.yearStart} · {countryById.get(stop.countryId)}
                  </p>
                  {stop.sourcePdf ? (
                    <p className="meta">
                      Source: {stop.sourcePdf} · p.{stop.sourcePage ?? 1}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            {selectedStop ? (
              <div className="journey-sidebar-gallery">
                <div className="row">
                  <h4 className="section-title">Related previews</h4>
                  <span className="chip">{selectedStop.name}</span>
                </div>
                <div className="journey-sidebar-gallery__grid">
                  {stopArtifacts.map((artifact) => (
                    <Link
                      key={artifact.id}
                      href={`/artifacts/${artifact.id}`}
                      className="journey-sidebar-thumb"
                    >
                      <Image
                        src={thumbFor(artifact.id)}
                        alt={`${artifact.title} preview`}
                        width={360}
                        height={220}
                      />
                      <span>{artifact.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

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
