# English Content Recommender

A research-first movie and web-series recommendation app for English-language content only.

## Workspace

- `apps/web`: Next.js frontend and edge-friendly API routes
- `apps/recommender_api`: FastAPI recommender service
- `packages/shared-types`: shared TypeScript contracts
- `data/seeds`: local seed catalog
- `docs`: architecture and modeling notes

## Local development

### Web

```bash
npm install
npm run dev:web
```

### Recommender API

```bash
python -m venv .venv
.venv/Scripts/activate
pip install -r apps/recommender_api/requirements.txt
npm run dev:api
```

The web app expects `RECOMMENDER_API_BASE_URL=http://localhost:8000`.
Browser requests go through the Next.js `/api/*` proxy by default. Only set
`NEXT_PUBLIC_RECOMMENDER_API_BASE_URL` if you intentionally want the browser to
call the FastAPI service directly.

### Larger catalog

The checked-in seed catalog is intentionally small. To generate a larger local catalog from TMDB:

```powershell
$env:TMDB_API_KEY="your_tmdb_api_key"
$env:OMDB_API_KEY="your_omdb_key" # optional
.\.venv\Scripts\python.exe apps\recommender_api\ingest_tmdb_catalog.py --limit 120 --region US
$env:CATALOG_PATH="data/seeds/english_titles.generated.json"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/recommender_api --port 8000
```

Use `--region IN`, `--region US`, or another TMDB watch-provider region depending on the platform availability you want to display.
`OMDB_API_KEY` is optional; when present, generated titles include IMDb ratings.
If you have TMDB's API Read Access Token instead of the API key, set `TMDB_API_TOKEN` instead of `TMDB_API_KEY`.
For a first run, use `--limit 120` or `--limit 250`; `--limit 1000` makes more than 1,000 network requests and can take a while.

## Product flow

1. Land on a premium CTA page.
2. Optionally prime the session with `movie / series / either` and an exploration level.
3. Rate one title at a time with `Like`, `Dislike`, `Not seen`, or `Stop`.
4. Receive one hero recommendation plus backup picks and explanation reasons.

## Model

The local implementation ships with a hybrid metadata-driven scoring engine plus a session bandit heuristic:

- metadata embeddings from genres, tone tags, cast, and editorial features
- live preference vector updates from session feedback
- exploration-aware next-title selection
- popularity dampening and diversity-aware final reranking

See `docs/modeling.md` for details.

## Production notes

- `CATALOG_PATH` controls which JSON catalog the FastAPI service loads. The default is `data/seeds/english_titles.generated.json`.
- `SESSION_STORE_PATH` persists session state across backend restarts. On Railway, point it at a mounted volume path such as `/data/recommender_sessions.json`.
- `ALLOWED_ORIGINS` should include your Vercel domain if you expose the backend directly to browsers.
- Vercel should set `RECOMMENDER_API_BASE_URL` so its `/api/*` routes can reach the Railway backend.
- The Vercel proxy still recognizes the legacy `NEXT_PUBLIC_API_URL` variable, but `RECOMMENDER_API_BASE_URL` is preferred.
