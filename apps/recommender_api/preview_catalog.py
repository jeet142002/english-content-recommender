from __future__ import annotations

from apps.recommender_api.app.services.catalog import load_catalog

if __name__ == "__main__":
    for title in load_catalog():
        print(f"{title.title} ({title.year}) - {title.kind}")
