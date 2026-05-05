from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.recommender_api.app.routers.session import router as session_router
from apps.recommender_api.app.services.catalog import load_catalog


app = FastAPI(title="English Content Recommender API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "catalogSize": len(load_catalog())}


@app.get("/title/{title_id}")
def title_detail(title_id: str) -> dict[str, object]:
    title = next((item for item in load_catalog() if item.id == title_id), None)
    if not title:
        return {"ok": False}
    return {"ok": True, "title": title}


app.include_router(session_router)
