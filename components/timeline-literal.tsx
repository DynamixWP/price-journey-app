"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { scaleLinear } from "d3-scale";
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

  const timelineYears = useMemo(() => unique(entries.map((entry) => entry.year)).sort((a, b) => a - b), [entries]);
  const minYear = timelineYears[0] ?? years[0] ?? 1931;
  const maxYear = timelineYears[timelineYears.length - 1] ?? years[years.length - 1] ?? 1937;
  const domainMin = minYear === maxYear ? minYear - 1 : minYear;
  const domainMax = minYear === maxYear ? maxYear + 1 : maxYear;

  const svgWidth = Math.max(960, timelineYears.length * 170, entries.length * 68);
  const svgHeight = 360;
  const margin = { top: 24, right: 52, bottom: 36, left: 52 };
  const axisY = Math.round(svgHeight / 2);
  const laneY = [88, 132, 228, 272];

  const xScale = useMemo(
    () =>
      scaleLinear([domainMin, domainMax], [margin.left, svgWidth - margin.right]),
    [domainMax, domainMin, margin.left, margin.right, svgWidth],
  );

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
        <svg
          className="timeline-svg"
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label="Interactive timeline of stops by year"
        >
          <LinePath
            data={[
              { x: margin.left, y: axisY },
              { x: svgWidth - margin.right, y: axisY },
            ]}
            x={(d) => d.x}
            y={(d) => d.y}
            stroke="#9f8253"
            strokeWidth={2}
          />

          {timelineYears.map((year) => {
            const x = xScale(year);
            return (
              <Group key={year} left={x} top={axisY}>
                <line y1={-9} y2={9} stroke="#8d7044" strokeWidth={2} />
                <text
                  y={24}
                  textAnchor="middle"
                  className="timeline-svg__year-label"
                >
                  {year}
                </text>
              </Group>
            );
          })}

          {entries.map((entry, index) => {
            const x = xScale(entry.year);
            const y = laneY[index % laneY.length];
            const isActive = selected?.stop.id === entry.stop.id;
            const isTop = y < axisY;
            return (
              <Group
                key={entry.stop.id}
                left={x}
                top={y}
                className={`timeline-svg__node ${isActive ? "is-active" : ""}`}
                onClick={() => setSelectedStopId(entry.stop.id)}
                role="button"
                aria-label={`Select stop ${entry.stop.name}`}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedStopId(entry.stop.id);
                  }
                }}
              >
                <line
                  y1={isTop ? 8 : -8}
                  y2={isTop ? axisY - y - 10 : axisY - y + 10}
                  className="timeline-svg__node-connector"
                />
                <circle r={isActive ? 8 : 6.2} className="timeline-svg__node-dot" />
                <rect
                  x={-84}
                  y={isTop ? -52 : 18}
                  width={168}
                  height={34}
                  rx={9}
                  className="timeline-svg__node-card"
                />
                <text
                  x={0}
                  y={isTop ? -30 : 39}
                  textAnchor="middle"
                  className="timeline-svg__stop-label"
                >
                  {entry.stop.name}
                </text>
              </Group>
            );
          })}
        </svg>
      </div>

      {selected ? (
        <article className="timeline-selection card">
          <p className="card__title">{selected.stop.name}</p>
          <p className="meta">{selected.stop.visitDateLabel ?? selected.year}</p>
          <div className="chip-row">
            <span className="chip">{selected.expeditionTitle}</span>
            <span className="chip">
              {project.countries.find((country) => country.id === selected.stop.countryId)?.name ??
                selected.stop.countryId}
            </span>
          </div>
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
