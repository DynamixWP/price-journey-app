import * as maplibre from "maplibre-gl";

// Serve the version-matched ES module worker and its shared module locally.
maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export * from "maplibre-gl";
