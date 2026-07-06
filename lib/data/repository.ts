import { journeySeed } from "./seed";
import { Artifact, ArtifactType, Expedition, SourceKind } from "./schema";

export interface ArtifactFilter {
  q?: string;
  countryId?: string;
  year?: number;
  type?: ArtifactType;
  sourceKind?: SourceKind;
  stopId?: string;
  expeditionId?: string;
}

export function getProject() {
  return journeySeed;
}

export function getExpeditionById(id: string): Expedition | undefined {
  return journeySeed.expeditions.find((expedition) => expedition.id === id);
}

export function getArtifactById(id: string): Artifact | undefined {
  return journeySeed.artifacts.find((artifact) => artifact.id === id);
}

export function getCollectionById(id: string) {
  return journeySeed.collections.find((collection) => collection.id === id);
}

export function listTimeline() {
  return [...journeySeed.expeditions].sort((a, b) => a.yearStart - b.yearStart);
}

export function searchArtifacts(filters: ArtifactFilter) {
  const normalizedQuery = filters.q?.trim().toLowerCase();

  return journeySeed.artifacts.filter((artifact) => {
    if (filters.stopId && !artifact.stopIds.includes(filters.stopId)) {
      return false;
    }

    if (filters.expeditionId && !artifact.expeditionIds.includes(filters.expeditionId)) {
      return false;
    }

    if (filters.countryId && !artifact.countryIds.includes(filters.countryId)) {
      return false;
    }

    if (typeof filters.year === "number" && !artifact.dateLabel.includes(String(filters.year))) {
      return false;
    }

    if (filters.type && artifact.type !== filters.type) {
      return false;
    }

    if (filters.sourceKind && artifact.sourceKind !== filters.sourceKind) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${artifact.title} ${artifact.description} ${artifact.tags.join(" ")}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
