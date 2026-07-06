export type SourceKind = "research_archive" | "archival_collection";

export type ArtifactType =
  | "photo"
  | "letter"
  | "field_note"
  | "publication"
  | "audio"
  | "video"
  | "slide"
  | "other";

export interface Country {
  id: string;
  name: string;
  iso2?: string;
  centroid?: { lat: number; lng: number };
}

export interface Stop {
  id: string;
  name: string;
  countryId: string;
  lat: number;
  lng: number;
  visitDateLabel?: string;
  artifactIds: string[];
}

export interface Expedition {
  id: string;
  title: string;
  summary: string;
  yearStart: number;
  yearEnd?: number;
  dateLabel: string;
  countries: string[];
  regions: string[];
  stops: Stop[];
  metrics: {
    photos: number;
    letters: number;
    fieldNotes: number;
    totalArtifacts: number;
  };
  sourceKinds: SourceKind[];
}

export interface Artifact {
  id: string;
  title: string;
  type: ArtifactType;
  sourceKind: SourceKind;
  collectionId: string;
  expeditionIds: string[];
  countryIds: string[];
  stopIds: string[];
  dateLabel: string;
  description: string;
  tags: string[];
  archiveRef: string;
}

export interface Collection {
  id: string;
  name: string;
  sourceKind: SourceKind;
  ownerPerson?: string;
  description: string;
  artifactIds: string[];
}

export interface JourneyProject {
  id: "weston-price-journey";
  title: string;
  years: number[];
  countries: Country[];
  expeditions: Expedition[];
  artifacts: Artifact[];
  collections: Collection[];
}

