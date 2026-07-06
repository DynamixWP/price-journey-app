"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { JourneyProject, SourceKind } from "@/lib/data/schema";

type Props = {
  project: JourneyProject;
};

const SOURCE_LABEL: Record<SourceKind, string> = {
  research_archive: "Research Archive",
  archival_collection: "Archival Collection",
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function TimelineLiteral({ project }: Props) {
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(project.expeditions[0]?.id ?? null);

  const years = useMemo(() => [...project.years].sort((a, b) => a - b), [project.years]);
  const minYear = years[0] ?? 1931;
  const maxYear = years[years.length - 1] ?? 1937;
  const yearSpan = Math.max(1, maxYear - minYear);

  const sourceOptions = useMemo(
    () => unique(project.expeditions.flatMap((expedition) => expedition.sourceKinds)),
    [project.expeditions],
  );

  const filtered = useMemo(
    () =>
      project.expeditions
        .filter((expedition) => {
          if (countryFilter !== "all" && !expedition.countries.includes(countryFilter)) {
            return false;
          }
          if (sourceFilter !== "all" && !expedition.sourceKinds.includes(sourceFilter)) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.yearStart - b.yearStart),
    [countryFilter, project.expeditions, sourceFilter],
  );

  const selected =
    filtered.find((expedition) => expedition.id === selectedId) ??
    filtered[0] ??
    null;

  return (
    <section className="panel timeline-literal">
      <div className="row">
        <h2 className="section-title">Timeline</h2>
        <span className="chip">{filtered.length} expeditions</span>
      </div>
      <p className="meta">
        Literal timeline view with year-based positioning and direct chapter access.
      </p>

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

          {filtered.map((expedition, index) => {
            const midYear = expedition.yearEnd
              ? (expedition.yearStart + expedition.yearEnd) / 2
              : expedition.yearStart;
            const left = ((midYear - minYear) / yearSpan) * 100;
            const lane = index % 2 === 0 ? "top" : "bottom";
            const isActive = selected?.id === expedition.id;

            return (
              <button
                key={expedition.id}
                type="button"
                className={`timeline-node timeline-node--${lane} ${isActive ? "is-active" : ""}`}
                style={{ left: `${left}%` }}
                onClick={() => setSelectedId(expedition.id)}
              >
                <span className="timeline-node__dot" />
                <span className="timeline-node__card">
                  <span className="timeline-node__title">{expedition.title}</span>
                  <span className="meta">{expedition.dateLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <article className="timeline-selection card">
          <p className="card__title">{selected.title}</p>
          <p className="meta">{selected.summary}</p>
          <div className="chip-row">
            <span className="chip">{selected.dateLabel}</span>
            {selected.countries.map((countryId) => {
              const label = project.countries.find((country) => country.id === countryId)?.name ?? countryId;
              return (
                <span className="chip" key={countryId}>
                  {label}
                </span>
              );
            })}
          </div>
          <Link href={`/chapters/${selected.id}`} className="timeline-selection__link">
            Open chapter &rarr;
          </Link>
        </article>
      ) : (
        <p className="meta">No expeditions match the selected filters.</p>
      )}
    </section>
  );
}

