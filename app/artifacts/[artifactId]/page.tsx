import Image from "next/image";
import Link from "next/link";
import { getArtifactById, getCollectionById, getProject } from "@/lib/data/repository";
import { imageForArtifact } from "@/lib/visuals";

type Props = {
  params: Promise<{ artifactId: string }>;
};

export default async function ArtifactViewerPage({ params }: Props) {
  const { artifactId } = await params;
  const artifact = getArtifactById(artifactId);
  const project = getProject();

  if (!artifact) {
    return (
      <section className="panel">
        <h2>Artifact not found</h2>
        <p className="meta">No artifact exists with id &quot;{artifactId}&quot;.</p>
      </section>
    );
  }

  const collection = getCollectionById(artifact.collectionId);
  const countries = artifact.countryIds
    .map((countryId) => project.countries.find((country) => country.id === countryId)?.name)
    .filter(Boolean);
  const relatedExpedition = project.expeditions.find((expedition) =>
    artifact.expeditionIds.includes(expedition.id),
  );

  return (
    <article className="artifact-sheet">
      <Link href="/collections" className="artifact-sheet__back">← Return to archive</Link>
      <div className="artifact-sheet__grid">
        <figure className="artifact-sheet__visual">
          <Image
            src={imageForArtifact(artifact)}
            alt={`Conceptual period recreation accompanying ${artifact.title}`}
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
            priority
          />
          <figcaption>Conceptual period recreation · not an original archive image</figcaption>
          <span className="artifact-sheet__stamp">{artifact.archiveRef}</span>
        </figure>
        <section className="artifact-sheet__content">
          <div className="artifact-sheet__eyebrow">
            <span>{artifact.type.replace("_", " ")}</span><span>{artifact.dateLabel}</span>
          </div>
          <h1>{artifact.title}</h1>
          <p className="artifact-sheet__lede">{artifact.description}</p>
          <dl className="artifact-sheet__facts">
            <div><dt>Collection</dt><dd>{collection?.name ?? artifact.collectionId}</dd></div>
            <div><dt>Places</dt><dd>{countries.join(", ")}</dd></div>
            <div><dt>Reference</dt><dd>{artifact.archiveRef}</dd></div>
            <div><dt>Keywords</dt><dd>{artifact.tags.join(" · ")}</dd></div>
          </dl>
          {relatedExpedition ? (
            <Link href={`/chapters/${relatedExpedition.id}`} className="editorial-cta">
              Continue through {relatedExpedition.title} <span>→</span>
            </Link>
          ) : null}
        </section>
      </div>
    </article>
  );
}
