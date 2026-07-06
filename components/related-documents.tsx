"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Artifact, ArtifactType } from "@/lib/data/schema";

type Props = {
  stopId: string;
  stopName: string;
  artifacts: Artifact[];
};

type TabKey = "all" | "photo" | "letter" | "field_note";

const TAB_OPTIONS: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "photo", label: "Photos" },
  { key: "letter", label: "Letters" },
  { key: "field_note", label: "Notes" },
];

const TYPE_PRIORITY: Record<ArtifactType, number> = {
  photo: 1,
  letter: 0.9,
  field_note: 0.85,
  publication: 0.7,
  audio: 0.65,
  video: 0.65,
  slide: 0.6,
  other: 0.55,
};

function computeRelevance(artifact: Artifact): number {
  const base = TYPE_PRIORITY[artifact.type] ?? 0.5;
  let hash = 0;
  for (const char of artifact.id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  const jitter = (hash % 100) / 1000;
  return base + jitter;
}

function diversifyByType(artifacts: Artifact[], limit: number): Artifact[] {
  const sorted = [...artifacts].sort(
    (a, b) => computeRelevance(b) - computeRelevance(a),
  );

  const selected: Artifact[] = [];
  const seen = new Set<ArtifactType>();

  for (const artifact of sorted) {
    if (!seen.has(artifact.type)) {
      selected.push(artifact);
      seen.add(artifact.type);
    }
    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const artifact of sorted) {
    if (selected.some((item) => item.id === artifact.id)) {
      continue;
    }
    selected.push(artifact);
    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function displayTypeLabel(type: ArtifactType) {
  if (type === "field_note") return "Field Note";
  return type[0].toUpperCase() + type.slice(1);
}

function getDummyThumbnail(artifact: Artifact) {
  return `https://picsum.photos/seed/${encodeURIComponent(artifact.id)}/420/280`;
}

function buildDemoDocs(stopName: string, tab: TabKey, amount: number): Artifact[] {
  const cycle: ArtifactType[] =
    tab === "all" ? ["photo", "letter", "field_note"] : [tab as ArtifactType];
  const docs: Artifact[] = [];

  for (let index = 0; index < amount; index += 1) {
    const type = cycle[index % cycle.length];
    docs.push({
      id: `demo-${stopName}-${type}-${index}`,
      title: `${stopName} ${displayTypeLabel(type)} ${index + 1}`,
      type,
      sourceKind: "archival_collection",
      collectionId: "demo",
      expeditionIds: [],
      countryIds: [],
      stopIds: [],
      dateLabel: "Demo",
      description: "Visual placeholder document to preview this stop layout.",
      tags: ["demo"],
      archiveRef: "Demo",
    });
  }

  return docs;
}

export function RelatedDocuments({ stopId, stopName, artifacts }: Props) {
  const [tab, setTab] = useState<TabKey>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return artifacts;
    return artifacts.filter((artifact) => artifact.type === tab);
  }, [artifacts, tab]);

  const visible = useMemo(() => {
    const base = diversifyByType(filtered, 6);
    if (base.length >= 6) {
      return base;
    }

    const placeholders = buildDemoDocs(stopName, tab, 6 - base.length);
    return [...base, ...placeholders];
  }, [filtered, stopName, tab]);

  if (artifacts.length === 0) {
    return <p className="meta">No related documents yet.</p>;
  }

  const viewAllHref =
    tab === "all"
      ? `/collections?stop=${encodeURIComponent(stopId)}`
      : `/collections?stop=${encodeURIComponent(stopId)}&type=${encodeURIComponent(tab)}`;

  return (
    <section className="related-docs">
      <div className="row">
        <h4 className="section-title">Related Documents</h4>
        <span className="chip">{stopName}</span>
      </div>

      <div className="related-docs__tabs">
        {TAB_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`chip related-docs__tab ${tab === option.key ? "is-active" : ""}`}
            onClick={() => setTab(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="related-docs__grid">
        {visible.map((artifact) => (
          <article className="related-doc-card" key={artifact.id}>
            <Image
              className="related-doc-card__image"
              src={getDummyThumbnail(artifact)}
              alt={`${artifact.title} preview`}
              width={420}
              height={280}
            />
            <div className="related-doc-card__body">
              <p className="related-doc-card__title">{artifact.title}</p>
              <p className="meta">{artifact.description}</p>
              <div className="chip-row">
                <span className="chip">{displayTypeLabel(artifact.type)}</span>
                <span className="chip">{artifact.dateLabel}</span>
                <span className="chip">{artifact.sourceKind}</span>
                {artifact.id.startsWith("demo-") ? <span className="chip">Demo</span> : null}
              </div>
              {artifact.id.startsWith("demo-") ? (
                <span className="meta">Demo preview only</span>
              ) : (
                <Link className="meta" href={`/artifacts/${artifact.id}`}>
                  Open document &rarr;
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {filtered.length > 0 ? (
        <Link href={viewAllHref} className="related-docs__view-all">
          View all related documents ({filtered.length})
        </Link>
      ) : null}
    </section>
  );
}
