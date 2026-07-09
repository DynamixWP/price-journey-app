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

type Theme = "light" | "dark";

type MarkerRef = {
  marker: maplibregl.Marker;
  button: HTMLButtonElement;
  coords: LngLatLike;
  stopId: string;
  expeditionId: string;
  years: number[];
};

const LIGHT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json";
const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

function getStopYears(stop: JourneyProject["expeditions"][number]["stops"][number], yearStart: number, yearEnd?: number) {
  const parsed = stop.visitDateLabel?.match(/\d{4}/g)?.map(Number) ?? [];
  if (parsed.length > 0) {
    return [...new Set(parsed)];
  }
  const end = yearEnd ?? yearStart;
  const years: number[] = [];
  for (let year = yearStart; year <= end; year += 1) {
    years.push(year);
  }
  return years;
}

export function JourneyMap({ project }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<MarkerRef[]>([]);
  const selectedExpeditionId = useJourneyMapStore((state) => state.selectedExpeditionId);
  const setSelectedExpeditionId = useJourneyMapStore((state) => state.setSelectedExpeditionId);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [theme, setTheme] = useState<Theme>("light");

  const mapYears = useMemo(() => {
    const years = new Set<number>();
    for (const expedition of project.expeditions) {
      for (const stop of expedition.stops) {
        for (const year of getStopYears(stop, expedition.yearStart, expedition.yearEnd)) {
          years.add(year);
        }
      }
    }
    return [...years].sort((a, b) => a - b);
  }, [project.expeditions]);

  const expeditionStopsByYear = useMemo(() => {
    const byExpedition = new Map<string, Set<string>>();
    for (const expedition of project.expeditions) {
      const stopIds = new Set<string>();
      for (const stop of expedition.stops) {
        const years = getStopYears(stop, expedition.yearStart, expedition.yearEnd);
        if (selectedYear === "all" || years.includes(selectedYear)) {
          stopIds.add(stop.id);
        }
      }
      byExpedition.set(expedition.id, stopIds);
    }
    return byExpedition;
  }, [project.expeditions, selectedYear]);

  const visibleExpeditions = useMemo(
    () => project.expeditions.filter((expedition) => (expeditionStopsByYear.get(expedition.id)?.size ?? 0) > 0),
    [expeditionStopsByYear, project.expeditions],
  );

  const selectedExpedition = useMemo(
    () => visibleExpeditions.find((expedition) => expedition.id === selectedExpeditionId),
    [visibleExpeditions, selectedExpeditionId],
  );

  const countryById = useMemo(
    () => new Map(project.countries.map((country) => [country.id, country.name])),
    [project.countries],
  );
  const visibleStopsForSelectedExpedition = useMemo(() => {
    if (!selectedExpedition) return [];
    const stopIds = expeditionStopsByYear.get(selectedExpedition.id);
    if (!stopIds) return [];
    return selectedExpedition.stops.filter((stop) => stopIds.has(stop.id));
  }, [expeditionStopsByYear, selectedExpedition]);
  const selectedStop = useMemo(() => {
    return (
      visibleStopsForSelectedExpedition.find((stop) => stop.id === selectedStopId) ??
      visibleStopsForSelectedExpedition[0] ??
      null
    );
  }, [selectedStopId, visibleStopsForSelectedExpedition]);
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
    const root = document.documentElement;
    const getTheme = (): Theme => (root.dataset.theme === "dark" ? "dark" : "light");
    setTheme(getTheme());

    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
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
        markerButton.innerHTML = `<svg class="map-marker-icon" width="22" height="30" viewBox="0 0 22 30" fill="none" aria-hidden="true"><path d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 19 11 19S22 19.25 22 11C22 4.925 17.075 0 11 0z" fill="currentColor"/><circle cx="11" cy="11" r="4" fill="white" fill-opacity="0.85"/></svg><span class="map-marker-btn__year">${stop.visitDateLabel ?? expedition.yearStart}</span>`;
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
          years: getStopYears(stop, expedition.yearStart, expedition.yearEnd),
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
    if (!mapRef.current) return;
    mapRef.current.setStyle(theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE);
  }, [theme]);

  useEffect(() => {
    let hasVisibleMarkers = false;
    for (const entry of markersRef.current) {
      const isVisible = selectedYear === "all" || entry.years.includes(selectedYear);
      entry.button.style.display = isVisible ? "" : "none";
      if (isVisible) hasVisibleMarkers = true;
    }

    if (!hasVisibleMarkers) {
      setSelectedExpeditionId(null);
      setSelectedStopId(null);
      return;
    }

    if (selectedExpeditionId) {
      const expeditionStopIds = expeditionStopsByYear.get(selectedExpeditionId);
      if (!expeditionStopIds || expeditionStopIds.size === 0) {
        setSelectedExpeditionId(null);
        setSelectedStopId(null);
      } else if (selectedStopId && !expeditionStopIds.has(selectedStopId)) {
        setSelectedStopId(null);
      }
    }
  }, [expeditionStopsByYear, selectedExpeditionId, selectedStopId, selectedYear, setSelectedExpeditionId]);

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
    <section className="journey-map-shell">
      <aside className="journey-filters-sidebar">
        <div className="row">
          <h3 className="section-title">Filters</h3>
          <button
            type="button"
            className="chip filter-chip icon-button"
            onClick={() => setSelectedYear("all")}
            aria-label="Reset year filter"
            title="Reset year filter"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 12a9 9 0 1 1-2.64-6.36M21 4v6h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="filter-group journey-filters-sidebar__group">
          <p className="meta">Year</p>
          <div className="journey-filters-sidebar__years">
            <button
              type="button"
              className={`chip filter-chip ${selectedYear === "all" ? "is-active" : ""}`}
              onClick={() => setSelectedYear("all")}
            >
              All years
            </button>
            {mapYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`chip filter-chip ${selectedYear === year ? "is-active" : ""}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className={`journey-layout panel ${selectedExpedition ? "has-open-sidebar" : ""}`}>
        <div className="journey-map">
          <h2 className="section-title">Journey Map</h2>
          <p className="meta">
            Tap a journey on the map to open its chapter in the sidebar.
          </p>

          <div ref={mapContainerRef} className="journey-map__surface" />

          <div className="journey-map__legend">
            {visibleExpeditions.map((expedition) => (
              <button
                key={expedition.id}
                type="button"
                className={`chip journey-map__chip ${selectedExpeditionId === expedition.id ? "is-active" : ""}`}
                onClick={() => {
                  setSelectedExpeditionId(expedition.id);
                  const firstVisibleStop = expedition.stops.find((stop) =>
                    expeditionStopsByYear.get(expedition.id)?.has(stop.id),
                  );
                  setSelectedStopId(firstVisibleStop?.id ?? null);
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
                  className="journey-sidebar__close icon-button"
                  onClick={() => setSelectedExpeditionId(null)}
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M18 6 6 18M6 6l12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                    />
                  </svg>
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
                {visibleStopsForSelectedExpedition.map((stop) => (
                  <li
                    className={`journey-stop-card ${selectedStop?.id === stop.id ? "is-active" : ""}`}
                    key={stop.id}
                  >
                    <button
                      type="button"
                      className="card journey-stop-card__button"
                      onClick={() => setSelectedStopId(stop.id)}
                    >
                      <p className="card__title">{stop.name}</p>
                      <p className="meta">
                        {stop.visitDateLabel ?? selectedExpedition.yearStart} · {countryById.get(stop.countryId)}
                      </p>
                    </button>
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
    </section>
  );
}
