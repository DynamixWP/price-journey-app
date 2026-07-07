# Price Journey App

MVP frontend used to validate the mockup flow:

- Journey Map (sidebar + main map)
- Expedition Chapter
- Artifact Viewer
- Collections / Search
- Timeline
- Health endpoint: `GET /api/health`

## Local development 

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Main structure

```txt
app/
  page.tsx                         # Journey Map
  timeline/page.tsx
  chapters/[expeditionId]/page.tsx
  artifacts/[artifactId]/page.tsx
  collections/page.tsx
  api/health/route.ts

lib/data/
  schema.ts                        # types
  seed.ts                          # mock data
  repository.ts                    # in-memory queries
```

## Database recommendation by stage

1. **Now (MVP):** use the in-memory `lib/data/seed.ts` to iterate quickly on UX and structure.
2. **Next stage:** migrate to **Supabase Postgres** once you define:
   - final entity model
   - auth/permissions
   - real metadata ingestion

Conclusion: **Supabase is a good fit**, but **not on day one** of the visual prototype. First validate navigation and the data model.
