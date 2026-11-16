import Image from "next/image";
import Link from "next/link";
import { RelatedDocuments } from "@/components/related-documents";
import { getExpeditionById, getProject } from "@/lib/data/repository";
import { imageForExpedition } from "@/lib/visuals";

type Props = {
  params: Promise<{ expeditionId: string }>;
};

export default async function ExpeditionChapterPage({ params }: Props) {
  const { expeditionId } = await params;
  const project = getProject();
  const expedition = getExpeditionById(expeditionId);

  if (!expedition) {
    return (
      <section className="panel">
        <h2>Chapter not found</h2>
        <p className="meta">No chapter exists with id &quot;{expeditionId}&quot;.</p>
      </section>
    );
  }

  return (
    <article className="chapter-page">
      <header className="chapter-hero">
        <Image src={imageForExpedition(expedition)} alt="Conceptual period recreation" fill priority sizes="100vw" />
        <div className="chapter-hero__shade" />
        <div className="chapter-hero__content">
          <Link href="/" className="chapter-hero__back">← Expedition atlas</Link>
          <p>Field chapter · {expedition.dateLabel}</p>
          <h1>{expedition.title}</h1>
          <span>{expedition.summary}</span>
        </div>
        <small>Conceptual period recreation · not an original archive image</small>
      </header>
      <section className="chapter-body">
        <div className="chapter-intro">
          <p className="chapter-dropcap">{expedition.summary}</p>
          <div className="chapter-metrics">
            <span><b>{expedition.stops.length}</b> field stops</span>
            <span><b>{expedition.metrics.totalArtifacts}</b> records</span>
            <span><b>{expedition.countries.length}</b> countries</span>
          </div>
        </div>
        <div className="chapter-route-heading"><span>Route log</span><strong>{expedition.regions.join(" · ")}</strong></div>
        <ol className="chapter-stops">
        {expedition.stops.map((stop) => {
          const country = project.countries.find((item) => item.id === stop.countryId);
          return (
            <li key={stop.id}>
              <div className="chapter-stop__index" />
              <div className="chapter-stop__heading">
                <span>{stop.visitDateLabel ?? expedition.dateLabel}</span>
                <h2>{stop.name}</h2>
                <p>{country?.name} · {Math.abs(stop.lat).toFixed(2)}°{stop.lat >= 0 ? "N" : "S"}, {Math.abs(stop.lng).toFixed(2)}°{stop.lng >= 0 ? "E" : "W"}</p>
              </div>
              <RelatedDocuments
                stopId={stop.id}
                stopName={stop.name}
                artifacts={project.artifacts.filter((artifact) =>
                  stop.artifactIds.includes(artifact.id),
                )}
              />
            </li>
          );
        })}
        </ol>
      </section>
    </article>
  );
}
