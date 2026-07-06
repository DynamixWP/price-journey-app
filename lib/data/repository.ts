import { journeySeed } from "./seed";
import { Artifact, ArtifactType, Expedition, SourceKind } from "./schema";

export interface ArtifactFilter {
  q?: string;
  countryId?: string;
  countryIds?: string[];
  year?: number;
  years?: number[];
  type?: ArtifactType;
  types?: ArtifactType[];
  sourceKind?: SourceKind;
  sourceKinds?: SourceKind[];
  stopId?: string;
  stopIds?: string[];
  expeditionId?: string;
  expeditionIds?: string[];
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
  const years = filters.years ?? (typeof filters.year === "number" ? [filters.year] : []);
  const countryIds = filters.countryIds ?? (filters.countryId ? [filters.countryId] : []);
  const types = filters.types ?? (filters.type ? [filters.type] : []);
  const sourceKinds = filters.sourceKinds ?? (filters.sourceKind ? [filters.sourceKind] : []);
  const stopIds = filters.stopIds ?? (filters.stopId ? [filters.stopId] : []);
  const expeditionIds =
    filters.expeditionIds ?? (filters.expeditionId ? [filters.expeditionId] : []);

  return journeySeed.artifacts.filter((artifact) => {
    if (stopIds.length > 0 && !stopIds.some((stopId) => artifact.stopIds.includes(stopId))) {
      return false;
    }

    if (
      expeditionIds.length > 0 &&
      !expeditionIds.some((expeditionId) => artifact.expeditionIds.includes(expeditionId))
    ) {
      return false;
    }

    if (countryIds.length > 0 && !countryIds.some((countryId) => artifact.countryIds.includes(countryId))) {
      return false;
    }

    if (years.length > 0 && !years.some((year) => artifact.dateLabel.includes(String(year)))) {
      return false;
    }

    if (types.length > 0 && !types.includes(artifact.type)) {
      return false;
    }

    if (sourceKinds.length > 0 && !sourceKinds.includes(artifact.sourceKind)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${artifact.title} ${artifact.description} ${artifact.tags.join(" ")}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
