from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from time import time

from apps.recommender_api.app.models.schemas import Title


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
    titles = [Title.model_validate(item) for item in payload if item.get("language") == "en"]
    return CatalogSnapshot(
        titles=titles,
        source_path=path,
        file_modified_at=stat.st_mtime,
        loaded_at=time(),
    )


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
