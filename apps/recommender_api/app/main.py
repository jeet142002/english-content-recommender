from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.recommender_api.app.routers.session import router as session_router
from apps.recommender_api.app.services.catalog import load_catalog
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
    return {
        "ok": True,
        "catalogSize": len(load_catalog()),
        "sessionStore": service.session_store.label,
    }


@app.get("/title/{title_id}")
def title_detail(title_id: str) -> dict[str, object]:
    title = next((item for item in load_catalog() if item.id == title_id), None)
    if not title:
        return {"ok": False}
    return {"ok": True, "title": title}


app.include_router(session_router)
