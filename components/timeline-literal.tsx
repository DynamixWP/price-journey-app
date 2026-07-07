"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { JourneyProject, SourceKind, Stop } from "@/lib/data/schema";

type Props = {
  project: JourneyProject;
};

type StopEntry = {
  stop: Stop;
  expeditionId: string;
  expeditionTitle: string;
  year: number;
  sourceKinds: SourceKind[];
};

const SOURCE_LABEL: Record<SourceKind, string> = {
  research_archive: "Research Archive",
  archival_collection: "Archival Collection",
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function getYear(stop: Stop, fallback: number) {
  if (stop.visitDateLabel) {
    const match = stop.visitDateLabel.match(/\d{4}/);
    if (match) {
      return Number(match[0]);
    }
  }
  return fallback;
}

export function TimelineLiteral({ project }: Props) {
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceKind | "all">("all");
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const years = useMemo(() => [...project.years].sort((a, b) => a - b), [project.years]);
  const minYear = years[0] ?? 1931;
  const maxYear = years[years.length - 1] ?? 1937;
  const yearSpan = Math.max(1, maxYear - minYear);

  const sourceOptions = useMemo(
    () => unique(project.expeditions.flatMap((expedition) => expedition.sourceKinds)),
    [project.expeditions],
  );

  const entries = useMemo(() => {
    const base: StopEntry[] = project.expeditions.flatMap((expedition) =>
      expedition.stops.map((stop) => ({
        stop,
        expeditionId: expedition.id,
        expeditionTitle: expedition.title,
        year: getYear(stop, expedition.yearStart),
        sourceKinds: expedition.sourceKinds,
      })),
    );

    return base
      .filter((entry) => {
        if (countryFilter !== "all" && entry.stop.countryId !== countryFilter) return false;
        if (sourceFilter !== "all" && !entry.sourceKinds.includes(sourceFilter)) return false;
        return true;
      })
      .sort((a, b) => (a.year === b.year ? a.stop.name.localeCompare(b.stop.name) : a.year - b.year));
  }, [countryFilter, project.expeditions, sourceFilter]);

  const selected =
    entries.find((entry) => entry.stop.id === selectedStopId) ?? entries[0] ?? null;

  return (
    <section className="panel timeline-literal">
      <div className="row">
        <h2 className="section-title">Timeline</h2>
        <span className="chip">{entries.length} stops</span>
      </div>
      <p className="meta">Literal timeline by exact travel stops and year.</p>

      <div className="timeline-filters">
        <div className="filter-group timeline-filter-group">
          <p className="meta">Country</p>
          <div className="chip-row">
            <button
              type="button"
              className={`chip filter-chip ${countryFilter === "all" ? "is-active" : ""}`}
              onClick={() => setCountryFilter("all")}
            >
              All
            </button>
            {project.countries.map((country) => (
              <button
                key={country.id}
                type="button"
                className={`chip filter-chip ${countryFilter === country.id ? "is-active" : ""}`}
                onClick={() => setCountryFilter(country.id)}
              >
                {country.name}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group timeline-filter-group">
          <p className="meta">Source</p>
          <div className="chip-row">
            <button
              type="button"
              className={`chip filter-chip ${sourceFilter === "all" ? "is-active" : ""}`}
              onClick={() => setSourceFilter("all")}
            >
              All
            </button>
            {sourceOptions.map((source) => (
              <button
                key={source}
                type="button"
                className={`chip filter-chip ${sourceFilter === source ? "is-active" : ""}`}
                onClick={() => setSourceFilter(source)}
              >
                {SOURCE_LABEL[source]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="timeline-track-wrap">
        <div className="timeline-track">
          <div className="timeline-axis" />

          {years.map((year) => {
            const left = ((year - minYear) / yearSpan) * 100;
            return (
              <div key={year} className="timeline-year" style={{ left: `${left}%` }}>
                <span className="timeline-year__tick" />
                <span className="timeline-year__label">{year}</span>
              </div>
            );
          })}

          {entries.map((entry, index) => {
            const left = ((entry.year - minYear) / yearSpan) * 100;
            const lane = index % 2 === 0 ? "top" : "bottom";
            const isActive = selected?.stop.id === entry.stop.id;
            return (
              <button
                key={entry.stop.id}
                type="button"
                className={`timeline-node timeline-node--${lane} ${isActive ? "is-active" : ""}`}
                style={{ left: `${left}%` }}
                onClick={() => setSelectedStopId(entry.stop.id)}
              >
                <span className="timeline-node__dot" />
                <span className="timeline-node__card">
                  <span className="timeline-node__title">{entry.stop.name}</span>
                  <span className="meta">{entry.year} · {entry.expeditionTitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <article className="timeline-selection card">
          <p className="card__title">{selected.stop.name}</p>
          <p className="meta">{selected.stop.visitDateLabel ?? selected.year}</p>
          <div className="chip-row">
            <span className="chip">
              {project.countries.find((country) => country.id === selected.stop.countryId)?.name ??
                selected.stop.countryId}
            </span>
            {selected.stop.sourcePdf ? <span className="chip">{selected.stop.sourcePdf}</span> : null}
          </div>
          {selected.stop.sourcePdf ? (
            <p className="meta">
              Source: {selected.stop.sourcePdf} · p.{selected.stop.sourcePage ?? 1}
            </p>
          ) : null}
          <Link href={`/chapters/${selected.expeditionId}`} className="timeline-selection__link">
            Open chapter &rarr;
          </Link>
        </article>
      ) : (
        <p className="meta">No stops match the selected filters.</p>
      )}
    </section>
  );
}

