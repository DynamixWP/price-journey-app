import Link from "next/link";
import { getProject, searchArtifacts } from "@/lib/data/repository";
import { ArtifactType, SourceKind } from "@/lib/data/schema";

type SearchParams = Promise<{
  q?: string;
  country?: string;
  year?: string;
  type?: ArtifactType;
  source?: SourceKind;
  stop?: string;
  expedition?: string;
}>;

type Props = {
  searchParams: SearchParams;
};

export default async function CollectionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const project = getProject();
  const year = params.year ? Number(params.year) : undefined;
  const artifacts = searchArtifacts({
    q: params.q,
    countryId: params.country,
    year: Number.isFinite(year) ? year : undefined,
    type: params.type,
    sourceKind: params.source,
    stopId: params.stop,
    expeditionId: params.expedition,
  });
  const stopMatch = params.stop
    ? project.expeditions
        .flatMap((expedition) => expedition.stops)
        .find((stop) => stop.id === params.stop)
    : undefined;

  return (
    <section className="panel">
      <div className="row">
        <h2 className="section-title">Collections / Search</h2>
        <span className="chip">{artifacts.length} results</span>
      </div>
      <p className="meta">
        To test filters, use query params:{" "}
        <code>?q=peru&amp;source=archival_collection</code>
      </p>
      {stopMatch ? (
        <p className="meta">
          Filtered by stop: <strong>{stopMatch.name}</strong>
        </p>
      ) : null}
      {params.type ? (
        <p className="meta">
          Filtered by type: <strong>{params.type}</strong>
        </p>
      ) : null}

      <div className="space-top">
        <input className="search" readOnly value={params.q ?? ""} placeholder="Search query (q)" />
      </div>

      <ul className="list space-top">
        {artifacts.map((artifact) => (
          <li className="card" key={artifact.id}>
            <p className="card__title">{artifact.title}</p>
            <p className="meta">{artifact.description}</p>
            <div className="chip-row">
              <span className="chip">{artifact.type}</span>
              <span className="chip">{artifact.sourceKind}</span>
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
