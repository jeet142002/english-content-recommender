from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from time import time

from apps.recommender_api.app.models.schemas import Title
from apps.recommender_api.app.services.catalog_quality import assess_catalog_entry
from apps.recommender_api.app.services.metadata_enrichment import enrich_metadata


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_CATALOG_PATH = ROOT / "data" / "seeds" / "english_titles.generated.json"
_cache_lock = Lock()


@dataclass(frozen=True)
class CatalogSnapshot:
    titles: list[Title]
    source_path: Path
    file_modified_at: float
    loaded_at: float


_catalog_snapshot: CatalogSnapshot | None = None


def catalog_path() -> Path:
    configured_path = os.environ.get("CATALOG_PATH")
    if not configured_path:
        return DEFAULT_CATALOG_PATH

    path = Path(configured_path)
    if not path.is_absolute():
        path = ROOT / path
    return path


def _read_snapshot() -> CatalogSnapshot:
    path = catalog_path()
    stat = path.stat()
    payload = json.loads(path.read_text(encoding="utf-8"))
    titles = [
        Title.model_validate(enriched_item)
        for item in payload
        for enriched_item in [_enriched_payload(item)]
        if item.get("language") == "en"
        and enriched_item is not None
    ]
    return CatalogSnapshot(
        titles=titles,
        source_path=path,
        file_modified_at=stat.st_mtime,
        loaded_at=time(),
    )


def _enriched_payload(item: dict[str, object]) -> dict[str, object] | None:
    enriched = enrich_metadata(
        title=str(item.get("title") or ""),
        kind=str(item.get("kind") or "movie"),
        genres=[str(value) for value in item.get("genres", [])],
        subgenres=[str(value) for value in item.get("subgenres", [])],
        keywords=[str(value) for value in item.get("keywords", [])],
        overview=str(item.get("synopsis") or ""),
        tone=[str(value) for value in item.get("tone", [])],
        style=[str(value) for value in item.get("style", [])],
        certification=str(item.get("certification") or "NR"),
        runtime=int(item.get("runtime") or 0),
        seasons=int(item.get("seasons") or 0) if item.get("seasons") is not None else None,
        quality_score=float(item.get("qualityScore") or 0),
        popularity=float(item.get("popularity") or 0),
        familiarity=float(item.get("familiarity") or 0),
    )
    quality = assess_catalog_entry(
        title=str(item.get("title") or ""),
        original_language=str(item.get("originalLanguage") or "") or None,
        localized_languages=[str(value) for value in item.get("localizedLanguages", [])],
        quality_score=float(item.get("qualityScore") or 0),
        popularity=float(item.get("popularity") or 0),
        familiarity=float(item.get("familiarity") or 0),
        synopsis=str(item.get("synopsis") or ""),
    )
    if not quality.keep_in_catalog:
        return None
    output = dict(item)
    output["keywords"] = enriched.keywords
    output["subgenres"] = enriched.subgenres
    output["tone"] = enriched.tone
    output["style"] = enriched.style
    output["editorialTags"] = enriched.editorial_tags
    output["englishConfidence"] = quality.english_confidence
    output["trustScore"] = quality.trust_score
    output["trustFlags"] = quality.trust_flags
    return output


def get_catalog_snapshot() -> CatalogSnapshot:
    global _catalog_snapshot

    path = catalog_path()
    current_mtime = path.stat().st_mtime

    with _cache_lock:
        if (
            _catalog_snapshot is None
            or _catalog_snapshot.source_path != path
            or _catalog_snapshot.file_modified_at != current_mtime
        ):
            _catalog_snapshot = _read_snapshot()
        return _catalog_snapshot


def load_catalog() -> list[Title]:
    return get_catalog_snapshot().titles


def catalog_metadata() -> dict[str, object]:
    snapshot = get_catalog_snapshot()
    return {
        "catalogPath": str(snapshot.source_path),
        "catalogFileModifiedAt": snapshot.file_modified_at,
        "catalogLoadedAt": snapshot.loaded_at,
        "catalogSize": len(snapshot.titles),
    }


def by_id(title_id: str) -> Title:
    for title in load_catalog():
        if title.id == title_id:
            return title
    raise KeyError(title_id)
