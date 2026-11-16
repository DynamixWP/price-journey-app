import type { Artifact, Expedition } from "./data/schema";

export const archiveImages = {
  alpine: "/archive-concepts/alpine-recreation.png",
  arctic: "/archive-concepts/arctic-recreation.png",
  pacific: "/archive-concepts/pacific-recreation.png",
} as const;

export function imageForExpedition(expedition: Expedition) {
  if (expedition.id.includes("arctic")) return archiveImages.arctic;
  if (expedition.id.includes("pacific") || expedition.id.includes("africa") || expedition.id.includes("polynesia")) {
    return archiveImages.pacific;
  }
  return archiveImages.alpine;
}

export function imageForArtifact(artifact: Artifact) {
  const expedition = artifact.expeditionIds[0] ?? "";
  if (expedition.includes("arctic")) return archiveImages.arctic;
  if (expedition.includes("pacific") || expedition.includes("africa") || expedition.includes("polynesia")) {
    return archiveImages.pacific;
  }
  return archiveImages.alpine;
}
