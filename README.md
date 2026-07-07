# Price Journey App

Interactive Next.js app to present Weston A. Price's journeys around the world, including stops, annotations, photos, letters, and related archival artifacts.

The main experience is an interactive world map with a chapter sidebar, plus timeline and collection exploration views.

## Current status

This repository is an MVP frontend focused on validating navigation, interaction patterns, and data modeling before backend integration.

Included MVP surfaces:

- Journey Map (main map + expedition sidebar)
- Expedition Chapter
- Artifact Viewer
- Collections / Search
- Timeline
- Health endpoint: `GET /api/health`

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- MapLibre GL (interactive map)
- Zustand (map UI state)
- visx + d3-scale (timeline rendering)
- In-memory seed data (`lib/data/seed.ts`)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Available scripts:

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Interactive journey map with year filtering and expedition sidebar |
| `/timeline` | Literal timeline of stops with country/source filters |
| `/collections` | Artifact search and faceted filtering |
| `/chapters/[expeditionId]` | Expedition chapter details and stop-level related documents |
| `/artifacts/[artifactId]` | Artifact detail view |
| `/api/health` | Health check endpoint returning JSON status |

## App structure

```txt
app/
  layout.tsx                       # App shell (header/nav)
  page.tsx                         # Journey map entry route
  timeline/page.tsx                # Timeline route
  collections/page.tsx             # Search + filters route
  chapters/[expeditionId]/page.tsx # Expedition chapter route
  artifacts/[artifactId]/page.tsx  # Artifact detail route
  api/health/route.ts              # Health endpoint

components/
  journey-map.tsx                  # MapLibre map, markers, year filter, sidebar behavior
  timeline-literal.tsx             # SVG timeline visualization
  related-documents.tsx            # Stop-level related docs UI

lib/
  data/
    schema.ts                      # Domain types (JourneyProject, Expedition, Artifact, etc.)
    seed.ts                        # In-memory seed dataset used by the MVP
    repository.ts                  # Query helpers over seed data
  state/
    journey-map-store.ts           # Global selected expedition state (Zustand)
```

## Data model snapshot (seed)

The current seed (`lib/data/seed.ts`) contains:

- 6 expeditions
- 26 mapped stops
- 20 artifacts
- 3 collections
- 16 countries

All UI pages currently read from this in-memory dataset via `lib/data/repository.ts`.

## Interactive map details

- Map engine: MapLibre GL
- Base style: `https://demotiles.maplibre.org/style.json`
- Markers are generated from expedition stops (`lat`/`lng` in seed data)
- Year filter affects marker visibility and visible expedition/stops
- Sidebar state is coordinated through Zustand (`selectedExpeditionId`)

## Deployment (Google Cloud)

This app can be deployed to Google Cloud Run as a containerized Next.js web service.

### Option A: Deploy from source with Cloud Buildpacks

```bash
gcloud run deploy price-journey-app \
  --source . \
  --region <REGION> \
  --allow-unauthenticated
```

### Option B: Build image first, then deploy

```bash
gcloud builds submit --tag gcr.io/<PROJECT_ID>/price-journey-app

gcloud run deploy price-journey-app \
  --image gcr.io/<PROJECT_ID>/price-journey-app \
  --region <REGION> \
  --allow-unauthenticated
```

Notes:

- Cloud Run sets `PORT`; Next.js reads it automatically via `next start`.
- No runtime secrets are required for the current MVP.
- Outbound internet access is needed for map tiles (`demotiles.maplibre.org`) and image placeholders (`picsum.photos`).

## Data/backend roadmap

1. **Now (MVP):** keep using in-memory `lib/data/seed.ts` for UX and IA validation.
2. **Next stage:** migrate to a persistent database (e.g., Supabase Postgres) after finalizing:
   - entity model
   - auth/permissions
   - ingestion pipeline for real archive metadata
