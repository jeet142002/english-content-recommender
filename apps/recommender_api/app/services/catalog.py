from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

from apps.recommender_api.app.models.schemas import Title


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_CATALOG_PATH = ROOT / "data" / "seeds" / "english_titles.generated.json"


def catalog_path() -> Path:
    configured_path = os.environ.get("CATALOG_PATH")
    if not configured_path:
        return DEFAULT_CATALOG_PATH

    path = Path(configured_path)
    if not path.is_absolute():
        path = ROOT / path
    return path


@lru_cache(maxsize=1)
def load_catalog() -> list[Title]:
    payload = json.loads(catalog_path().read_text(encoding="utf-8"))
    return [Title.model_validate(item) for item in payload if item.get("language") == "en"]


def by_id(title_id: str) -> Title:
    for title in load_catalog():
        if title.id == title_id:
            return title
    raise KeyError(title_id)
