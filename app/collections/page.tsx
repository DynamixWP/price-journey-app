import Link from "next/link";
import { getProject, searchArtifacts } from "@/lib/data/repository";
import { Artifact, ArtifactType, SourceKind } from "@/lib/data/schema";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  searchParams: SearchParams;
};

type SortKey = "relevance" | "newest" | "oldest";

const SOURCE_LABEL: Record<SourceKind, string> = {
  research_archive: "Research Archive",
  archival_collection: "Archival Collection",
};

const TYPE_LABEL: Record<ArtifactType, string> = {
  photo: "Photo",
  letter: "Letter",
  field_note: "Field Note",
  publication: "Publication",
  audio: "Audio",
  video: "Video",
  slide: "Slide",
  other: "Other",
};

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function relevanceScore(artifact: Artifact): number {
  const typeWeight: Record<ArtifactType, number> = {
    photo: 1,
    letter: 0.9,
    field_note: 0.85,
    publication: 0.78,
    audio: 0.72,
    video: 0.72,
    slide: 0.68,
    other: 0.6,
  };
  let hash = 0;
  for (const char of artifact.id) {
    hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  }
  return (typeWeight[artifact.type] ?? 0.5) + (hash % 97) / 1000;
}

function sortArtifacts(artifacts: Artifact[], sort: SortKey): Artifact[] {
  const list = [...artifacts];
  if (sort === "newest") {
    return list.sort((a, b) => b.dateLabel.localeCompare(a.dateLabel));
  }
  if (sort === "oldest") {
    return list.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  }
  return list.sort((a, b) => relevanceScore(b) - relevanceScore(a));
}

export default async function CollectionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const project = getProject();

  const q = typeof params.q === "string" ? params.q : "";
  const countryValues = unique(asList(params.country));
  const stopValues = unique(asList(params.stop));
  const typeValues = unique(asList(params.type)).filter((value): value is ArtifactType =>
    [
      "photo",
      "letter",
      "field_note",
      "publication",
      "audio",
      "video",
      "slide",
      "other",
    ].includes(value),
  );
  const sourceValues = unique(asList(params.source)).filter((value): value is SourceKind =>
    ["research_archive", "archival_collection"].includes(value),
  );
  const yearValues = unique(asList(params.year))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const sortValue = typeof params.sort === "string" ? params.sort : "relevance";
  const sort = ["relevance", "newest", "oldest"].includes(sortValue)
    ? (sortValue as SortKey)
    : "relevance";

  const artifacts = sortArtifacts(
    searchArtifacts({
      q: q || undefined,
      countryIds: countryValues,
      stopIds: stopValues,
      types: typeValues,
      sourceKinds: sourceValues,
      years: yearValues,
    }),
    sort,
  );

  const allStops = project.expeditions.flatMap((expedition) => expedition.stops);
  const usedCountryIds = unique(project.artifacts.flatMap((artifact) => artifact.countryIds));
  const countryOptions = project.countries
    .filter((country) => usedCountryIds.includes(country.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const typeOptions = unique(project.artifacts.map((artifact) => artifact.type));
  const sourceOptions = unique(project.artifacts.map((artifact) => artifact.sourceKind));
  const yearOptions = [...project.years].sort((a, b) => b - a);

  const buildHref = (updates: {
    q?: string;
    country?: string[];
    stop?: string[];
    type?: string[];
    source?: string[];
    year?: number[];
    sort?: SortKey;
  }) => {
    const nextQ = updates.q !== undefined ? updates.q : q;
    const nextCountries = updates.country ?? countryValues;
    const nextStops = updates.stop ?? stopValues;
    const nextTypes = updates.type ?? typeValues;
    const nextSources = updates.source ?? sourceValues;
    const nextYears = updates.year ?? yearValues;
    const nextSort = updates.sort ?? sort;

    const qs = new URLSearchParams();
    if (nextQ.trim()) qs.set("q", nextQ.trim());
    for (const country of nextCountries) qs.append("country", country);
    for (const stop of nextStops) qs.append("stop", stop);
    for (const type of nextTypes) qs.append("type", type);
    for (const source of nextSources) qs.append("source", source);
    for (const year of nextYears) qs.append("year", String(year));
    if (nextSort !== "relevance") qs.set("sort", nextSort);
    const query = qs.toString();
    return query ? `/collections?${query}` : "/collections";
  };

  const hasActiveFilters =
    Boolean(q) ||
    countryValues.length > 0 ||
    stopValues.length > 0 ||
    typeValues.length > 0 ||
    sourceValues.length > 0 ||
    yearValues.length > 0 ||
    sort !== "relevance";

  return (
    <section className="panel collections-layout">
      <div className="row">
        <h2 className="section-title">Collections / Search</h2>
        <span className="chip">{artifacts.length} results</span>
      </div>

      <form method="get" className="collections-searchbar">
        <input className="search" name="q" defaultValue={q} placeholder="Search title, tags, and description" />
        {countryValues.map((country) => (
          <input key={`country-${country}`} type="hidden" name="country" value={country} />
        ))}
        {stopValues.map((stop) => (
          <input key={`stop-${stop}`} type="hidden" name="stop" value={stop} />
        ))}
        {typeValues.map((type) => (
          <input key={`type-${type}`} type="hidden" name="type" value={type} />
        ))}
        {sourceValues.map((source) => (
          <input key={`source-${source}`} type="hidden" name="source" value={source} />
        ))}
        {yearValues.map((year) => (
          <input key={`year-${year}`} type="hidden" name="year" value={year} />
        ))}
        {sort !== "relevance" ? <input type="hidden" name="sort" value={sort} /> : null}
        <button type="submit" className="filter-btn">
          Apply
        </button>
      </form>

      <div className="filters-toolbar">
        <p className="meta">Sort</p>
        <div className="chip-row">
          {(["relevance", "newest", "oldest"] as const).map((option) => (
            <Link
              key={option}
              href={buildHref({ sort: option })}
              className={`chip filter-chip ${sort === option ? "is-active" : ""}`}
            >
              {option === "relevance" ? "Relevance" : option === "newest" ? "Newest" : "Oldest"}
            </Link>
          ))}
        </div>
      </div>

      <details className="filters-panel" open={hasActiveFilters}>
        <summary className="filters-panel__summary">
          <span>{hasActiveFilters ? "Refine filters" : "Show filters"}</span>
          <span className="chip">{hasActiveFilters ? "Active" : "Optional"}</span>
        </summary>
        <div className="filters-grid compact">
          <div className="filter-group">
            <p className="meta">Type</p>
            <div className="chip-row">
              {typeOptions.map((option) => (
                <Link
                  key={option}
                  href={buildHref({ type: toggleValue(typeValues, option) })}
                  className={`chip filter-chip ${typeValues.includes(option) ? "is-active" : ""}`}
                >
                  {TYPE_LABEL[option]}
                </Link>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <p className="meta">Source</p>
            <div className="chip-row">
              {sourceOptions.map((option) => (
                <Link
                  key={option}
                  href={buildHref({ source: toggleValue(sourceValues, option) })}
                  className={`chip filter-chip ${sourceValues.includes(option) ? "is-active" : ""}`}
                >
                  {SOURCE_LABEL[option]}
                </Link>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <p className="meta">Country</p>
            <div className="chip-row">
              {countryOptions.map((country) => (
                <Link
                  key={country.id}
                  href={buildHref({ country: toggleValue(countryValues, country.id) })}
                  className={`chip filter-chip ${countryValues.includes(country.id) ? "is-active" : ""}`}
                >
                  {country.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <p className="meta">Year</p>
            <div className="chip-row">
              {yearOptions.map((year) => (
                <Link
                  key={year}
                  href={buildHref({
                    year: yearValues.includes(year)
                      ? yearValues.filter((value) => value !== year)
                      : [...yearValues, year],
                  })}
                  className={`chip filter-chip ${yearValues.includes(year) ? "is-active" : ""}`}
                >
                  {year}
                </Link>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <p className="meta">Stop</p>
            <div className="chip-row">
              {allStops.map((stop) => (
                <Link
                  key={stop.id}
                  href={buildHref({ stop: toggleValue(stopValues, stop.id) })}
                  className={`chip filter-chip ${stopValues.includes(stop.id) ? "is-active" : ""}`}
                >
                  {stop.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </details>

      {hasActiveFilters && (
        <div className="active-filters">
          <p className="meta">Active filters</p>
          <div className="chip-row">
            {q ? <span className="chip">Search: {q}</span> : null}
            {countryValues.map((value) => {
              const label = project.countries.find((country) => country.id === value)?.name ?? value;
              return <span className="chip" key={`active-country-${value}`}>Country: {label}</span>;
            })}
            {stopValues.map((value) => {
              const label = allStops.find((stop) => stop.id === value)?.name ?? value;
              return <span className="chip" key={`active-stop-${value}`}>Stop: {label}</span>;
            })}
            {typeValues.map((value) => (
              <span className="chip" key={`active-type-${value}`}>Type: {TYPE_LABEL[value]}</span>
            ))}
            {sourceValues.map((value) => (
              <span className="chip" key={`active-source-${value}`}>Source: {SOURCE_LABEL[value]}</span>
            ))}
            {yearValues.map((value) => (
              <span className="chip" key={`active-year-${value}`}>Year: {value}</span>
            ))}
            {sort !== "relevance" ? <span className="chip">Sort: {sort}</span> : null}
          </div>
          <Link href="/collections" className="filter-clear">
            Clear all
          </Link>
        </div>
      )}

      <ul className="list space-top">
        {artifacts.map((artifact) => (
          <li className="card" key={artifact.id}>
            <p className="card__title">{artifact.title}</p>
            <p className="meta">{artifact.description}</p>
            <div className="chip-row">
              <span className="chip">{TYPE_LABEL[artifact.type]}</span>
              <span className="chip">{SOURCE_LABEL[artifact.sourceKind]}</span>
              <span className="chip">{artifact.dateLabel}</span>
            </div>
            <Link href={`/artifacts/${artifact.id}`} className="meta">
              Open artifact &rarr;
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
