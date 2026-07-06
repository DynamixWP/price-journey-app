import { RelatedDocuments } from "@/components/related-documents";
import { getExpeditionById, getProject } from "@/lib/data/repository";

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
    <section className="panel">
      <h2 className="section-title">{expedition.title}</h2>
      <p className="meta">{expedition.summary}</p>
      <div className="chip-row space-top">
        <span className="chip">{expedition.dateLabel}</span>
        {expedition.regions.map((region) => (
          <span className="chip" key={region}>
            {region}
          </span>
        ))}
      </div>

      <h3 className="section-title space-top">Stops</h3>
      <ul className="list">
        {expedition.stops.map((stop) => {
          const country = project.countries.find((item) => item.id === stop.countryId);
          return (
            <li className="card" key={stop.id}>
              <p className="card__title">
                {stop.name} &middot; {country?.name}
              </p>
              <p className="meta">
                lat {stop.lat}, lng {stop.lng}
              </p>
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
      </ul>
    </section>
  );
}
