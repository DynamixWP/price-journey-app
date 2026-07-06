import Image from "next/image";
import { getArtifactById, getCollectionById, getProject } from "@/lib/data/repository";

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
  const previewUrl = `https://picsum.photos/seed/${encodeURIComponent(artifact.id)}/1200/800`;

  return (
    <section className="panel">
      <h2 className="section-title">Artifact Viewer</h2>
      <article className="card">
        <div className="artifact-preview">
          <Image
            src={previewUrl}
            alt={`${artifact.title} preview`}
            fill
            sizes="(max-width: 960px) 100vw, 70vw"
            className="artifact-preview__image"
            priority
          />
        </div>
        <p className="card__title">{artifact.title}</p>
        <p className="meta">{artifact.description}</p>
        <div className="chip-row">
          <span className="chip">{artifact.type}</span>
          <span className="chip">{artifact.sourceKind}</span>
          <span className="chip">{artifact.dateLabel}</span>
          <span className="chip">{artifact.archiveRef}</span>
        </div>
      </article>

      <table className="table space-top">
        <tbody>
          <tr>
            <th>Collection</th>
            <td>{collection?.name ?? artifact.collectionId}</td>
          </tr>
          <tr>
            <th>Countries</th>
            <td>{countries.join(", ")}</td>
          </tr>
          <tr>
            <th>Tags</th>
            <td>{artifact.tags.join(", ")}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
