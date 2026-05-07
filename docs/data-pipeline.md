# Data Pipeline

## Sources

### Primary metadata

- TMDB API for movies, series, posters, cast, crew, keywords, runtime, popularity, release year

### Offline weak supervision

- MovieLens-style ratings
- TMDB-aligned metadata exports

### First local seed

- `data/seeds/english_titles.json`

## English-only normalization rules

Filter titles by:

- `original_language == "en"` or dominant English localization
- English synopsis availability
- acceptable metadata completeness threshold

Normalize into a stable internal schema:

- title identity
- movie or series kind
- people graph
- genres
- tone tags
- style tags
- editorial keywords
- quality, popularity, and familiarity priors

## Enrichment strategy

1. ingest TMDB title payloads
2. flatten nested cast/crew structures
3. map platform metadata to internal enums
4. derive editorial tags from genres, keywords, and synopsis patterns
5. store raw payload plus normalized fields

## Storage model

Production target:

- `titles`
- `title_features`
- `people`
- `title_people`
- `sessions`
- `session_events`
- `recommendation_results`
- `model_versions`

Local prototype:

- JSON seed catalog
- JSON-backed session state through `SESSION_STORE_PATH`

## Local TMDB ingestion

`apps/recommender_api/ingest_tmdb_catalog.py` can generate a larger local JSON catalog:

```powershell
$env:TMDB_API_KEY="your_tmdb_api_key"
$env:OMDB_API_KEY="your_omdb_key" # optional
.\.venv\Scripts\python.exe apps\recommender_api\ingest_tmdb_catalog.py --limit 120 --region US
$env:CATALOG_PATH="data/seeds/english_titles.generated.json"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/recommender_api --port 8000
```

This keeps the app usable with the small checked-in seed while giving development a path to 100+ real titles without hand-writing metadata. A production catalog should move this into a scheduled ingestion job and persist normalized titles in the database.
`OMDB_API_KEY` is optional and is only needed for IMDb ratings.
If you have TMDB's API Read Access Token instead of the API key, set `TMDB_API_TOKEN` instead of `TMDB_API_KEY`.

`scripts/update-tmdb-data.py` writes the default generated catalog at `data/seeds/english_titles.generated.json`.
The GitHub Actions workflow stages that generated file so scheduled updates affect the same catalog the backend loads by default.
