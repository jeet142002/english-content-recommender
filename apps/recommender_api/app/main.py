from __future__ import annotations

import os
import random
from apps.recommender_api.app.models.schemas import LandingFeaturedTitle
from apps.recommender_api.app.models.schemas import LandingPostersResponse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.recommender_api.app.routers.session import router as session_router
from apps.recommender_api.app.services.catalog import catalog_metadata, load_catalog
from apps.recommender_api.app.services.recommender import service


def allowed_origins() -> list[str]:
    configured = os.environ.get("ALLOWED_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


app = FastAPI(title="English Content Recommender API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    metadata = catalog_metadata()
    return {
        "ok": True,
        "catalogSize": metadata["catalogSize"],
        "catalogPath": metadata["catalogPath"],
        "catalogFileModifiedAt": metadata["catalogFileModifiedAt"],
        "catalogLoadedAt": metadata["catalogLoadedAt"],
        "sessionStore": service.session_store.label,
    }


@app.get("/title/{title_id}")
def title_detail(title_id: str) -> dict[str, object]:
    title = next((item for item in load_catalog() if item.id == title_id), None)
    if not title:
        return {"ok": False}
    return {"ok": True, "title": title}


@app.get("/landing-featured", response_model=LandingFeaturedTitle)
def landing_featured() -> LandingFeaturedTitle:
    catalog = load_catalog()

    eligible_titles = [
        title
        for title in catalog
        if title.posterUrl
        and (title.tmdbRating or 0) >= 7.5
        and title.qualityScore >= 80
    ]

    featured = random.choice(eligible_titles)

    return LandingFeaturedTitle(
        title=featured.title,
        posterUrl=featured.posterUrl,
        genres=featured.genres[:2],
        tmdbRating=featured.tmdbRating,
        kind=featured.kind,
        runtime=featured.runtime,
        seasons=featured.seasons,
        tmdbId=featured.tmdbId,
    )

@app.get("/landing-posters", response_model=LandingPostersResponse)
def landing_posters() -> LandingPostersResponse:
    catalog = [
        title
        for title in load_catalog()
        if title.posterUrl
    ]

    selected = random.sample(
        catalog,
        k=min(3, len(catalog))
    )

    return LandingPostersResponse(
        posters=[title.posterUrl for title in selected]
    )


app.include_router(session_router)
