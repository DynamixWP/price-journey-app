# Price Journey App

MVP frontend para validar el flujo de mockups:

- Journey Map (sidebar + mapa principal)
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

Abrí http://localhost:3000.

## Estructura principal

```txt
app/
  page.tsx                         # Journey Map
  timeline/page.tsx
  chapters/[expeditionId]/page.tsx
  artifacts/[artifactId]/page.tsx
  collections/page.tsx
  api/health/route.ts

lib/data/
  schema.ts                        # tipos
  seed.ts                          # mock data
  repository.ts                    # queries en memoria
```

## Base de datos: recomendación por etapa

1. **Ahora (MVP):** usar `lib/data/seed.ts` en memoria para iterar rápido en UX y estructura.
2. **Próxima etapa:** migrar a **Supabase Postgres** cuando definas:
   - modelo final de entidades
   - auth/permisos
   - carga de metadata real

Conclusión: **sí conviene Supabase**, pero **no desde el día 1** del prototipo visual. Primero validá navegación y modelo.
