from __future__ import annotations

import argparse
import json
import os
import re
import socket
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry



ROOT = Path(__file__).resolve().parents[2]
TMDB_API_BASE = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
OMDB_API_BASE = "https://www.omdbapi.com/"
REQUEST_TIMEOUT_SECONDS = 30
DEFAULT_CATALOG_LIMIT = int(os.environ.get("TMDB_CATALOG_LIMIT", "240"))
DEFAULT_MAX_PAGES = int(os.environ.get("TMDB_MAX_PAGES", "50"))
DEFAULT_REQUEST_DELAY = float(os.environ.get("TMDB_REQUEST_DELAY", "1.2"))

session = requests.Session()

retry_strategy = Retry(
    total=5,
    backoff_factor=2,
    status_forcelist=[429, 500, 502, 503, 504, 520, 521, 522, 524],
    allowed_methods=["GET"],
)

adapter = HTTPAdapter(max_retries=retry_strategy)

session.mount("https://", adapter)
session.mount("http://", adapter)


class RequestFailedError(RuntimeError):
    pass


def is_bearer_token(value: str) -> bool:
    return value.startswith("eyJ") or value.count(".") >= 2


def sleep_for_retry(attempt: int, retry_after: str | None = None) -> None:
    if retry_after:
        try:
            time.sleep(max(1.0, float(retry_after)))
            return
        except ValueError:
            pass
    time.sleep(min(30.0, 1.5 * (2 ** (attempt - 1))))


def request_json(path, params=None):
    api_key = os.getenv("TMDB_API_KEY")
    api_token = os.getenv("TMDB_API_TOKEN")

    if not api_key and not api_token:
        raise RuntimeError(
            "TMDB_API_KEY or TMDB_API_TOKEN is required."
        )

    url = f"{TMDB_API_BASE}{path}"

    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
    }

    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"
    else:
        params = params or {}
        params["api_key"] = api_key

    try:
        response = session.get(
            url,
            params=params,
            headers=headers,
            timeout=30,
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as error:
        raise RequestFailedError(
            f"TMDB request failed for {path}: {error}"
        ) from error


def request_omdb_rating(imdb_id: str | None) -> float | None:
    api_key = os.environ.get("OMDB_API_KEY")

    if not api_key or not imdb_id:
        return None

    try:
        response = session.get(
            OMDB_API_BASE,
            params={
                "apikey": api_key,
                "i": imdb_id,
            },
            timeout=20,
        )

        response.raise_for_status()

        payload = response.json()

    except requests.exceptions.RequestException:
        return None

    rating = payload.get("imdbRating")

    if not rating or rating == "N/A":
        return None

    return float(rating)


def chunked_target_counts(count: int, weights: list[int]) -> list[int]:
    if count <= 0:
        return [0 for _ in weights]

    total_weight = sum(weights)
    raw = [(count * weight) / total_weight for weight in weights]
    counts = [int(value) for value in raw]
    remainder = count - sum(counts)

    ranked_indexes = sorted(
        range(len(weights)),
        key=lambda index: raw[index] - counts[index],
        reverse=True,
    )
    for index in ranked_indexes[:remainder]:
        counts[index] += 1

    return counts


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return slug or "untitled"


def first_year(date_value: str | None) -> int:
    if not date_value:
        return 0
    return int(date_value[:4])


def scale_popularity(value: float) -> float:
    return round(max(0, min(100, value)), 2)


def familiarity_score(popularity: float, vote_count: int) -> float:
    vote_component = min(45, vote_count / 250)
    return round(max(0, min(100, popularity * 0.55 + vote_component)), 2)


def extract_movie_certification(release_dates: dict[str, Any], region: str) -> str:
    results = release_dates.get("results", [])
    preferred = next((item for item in results if item.get("iso_3166_1") == region), None)
    fallback = next((item for item in results if item.get("iso_3166_1") == "US"), None)

    for item in [preferred, fallback]:
        for release in (item or {}).get("release_dates", []):
            certification = release.get("certification")
            if certification:
                return certification
    return "NR"


def extract_tv_certification(content_ratings: dict[str, Any], region: str) -> str:
    results = content_ratings.get("results", [])
    preferred = next((item for item in results if item.get("iso_3166_1") == region), None)
    fallback = next((item for item in results if item.get("iso_3166_1") == "US"), None)
    return (preferred or fallback or {}).get("rating") or "NR"


def extract_watch_providers(providers: dict[str, Any], region: str) -> list[str]:
    country_payload = providers.get("results", {}).get(region) or providers.get("results", {}).get("US") or {}
    flatrate = country_payload.get("flatrate", [])
    return [item["provider_name"] for item in flatrate if item.get("provider_name")][:6]


def spoken_language_names(detail: dict[str, Any]) -> list[str]:
    languages = []
    for item in detail.get("spoken_languages", []):
        name = item.get("english_name") or item.get("name") or item.get("iso_639_1")
        if name:
            languages.append(name)
    return sorted(set(languages))

def extract_trailer_key(videos: dict[str, Any]) -> str | None:
    results = videos.get("results", [])

    official_trailer = next(
        (
            item for item in results
            if item.get("site") == "YouTube"
            and item.get("type") == "Trailer"
            and item.get("official")
        ),
        None,
    )

    if official_trailer:
        return official_trailer.get("key")

    fallback_trailer = next(
        (
            item for item in results
            if item.get("site") == "YouTube"
            and item.get("type") in {"Trailer", "Teaser"}
        ),
        None,
    )

    if fallback_trailer:
        return fallback_trailer.get("key")

    return None


def derive_tags(genres: list[str], keywords: list[str], overview: str) -> tuple[list[str], list[str]]:
    haystack = " ".join([*genres, *keywords, overview]).lower()
    tone_rules = [
        ("dark", ["murder", "crime", "killer", "violent", "revenge", "war"]),
        ("funny", ["comedy", "sitcom", "funny", "comic"]),
        ("tense", ["thriller", "survival", "mystery", "suspense"]),
        ("emotional", ["drama", "family", "grief", "romance"]),
        ("epic", ["fantasy", "adventure", "space", "saga"]),
        ("cerebral", ["science fiction", "mystery", "psychological", "mind"]),
        ("warm", ["family", "friendship", "heart", "kindness"]),
    ]
    style_rules = [
        ("prestige", ["drama", "historical", "biography", "award"]),
        ("fast-paced", ["action", "adventure", "thriller"]),
        ("slow-burn", ["mystery", "psychological", "investigation"]),
        ("world-building", ["fantasy", "science fiction", "dystopian"]),
        ("character-driven", ["drama", "family", "romance"]),
        ("accessible", ["comedy", "family", "animation"]),
    ]

    tones = [label for label, terms in tone_rules if any(term in haystack for term in terms)][:3]
    styles = [label for label, terms in style_rules if any(term in haystack for term in terms)][:3]
    return tones or ["engaging"], styles or ["mainstream"]


def normalize_movie(summary: dict[str, Any], detail: dict[str, Any], region: str) -> dict[str, Any] | None:
    title = detail.get("title") or summary.get("title")
    year = first_year(detail.get("release_date") or summary.get("release_date"))
    poster_path = detail.get("poster_path") or summary.get("poster_path")
    cast = [item["name"] for item in detail.get("credits", {}).get("cast", [])[:3] if item.get("name")]
    director = next(
        (item["name"] for item in detail.get("credits", {}).get("crew", []) if item.get("job") == "Director"),
        None,
    )
    keywords = [item["name"] for item in detail.get("keywords", {}).get("keywords", []) if item.get("name")][:8]
    genres = [item["name"] for item in detail.get("genres", []) if item.get("name")]
    overview = detail.get("overview") or summary.get("overview") or ""

    if not title or not year or not poster_path or not overview or not cast or not genres:
        return None

    tones, styles = derive_tags(genres, keywords, overview)
    tmdb_rating = round(float(detail.get("vote_average") or 0), 1)
    external_ids = detail.get("external_ids", {})
    imdb_id = external_ids.get("imdb_id")

    imdb_rating = request_omdb_rating(imdb_id)
    trailer_key = extract_trailer_key(detail.get("videos", {}))

    return {
        "id": f"{slugify(title)}_{year}_{detail['id']}",
        "tmdbId": detail["id"],
        "trailerKey": trailer_key,
        "imdbId": imdb_id,
        "imdbUrl": f"https://www.imdb.com/title/{imdb_id}/" if imdb_id else None,
        "title": title,
        "year": year,
        "kind": "movie",
        "language": "en",
        "originalLanguage": detail.get("original_language"),
        "localizedLanguages": spoken_language_names(detail),
        "runtime": int(detail.get("runtime") or 0),
        "certification": extract_movie_certification(detail.get("release_dates", {}), region),
        "genres": genres,
        "subgenres": keywords[:3] or genres[:2],
        "keywords": keywords,
        "cast": cast,
        "director": director,
        "synopsis": overview,
        "tone": tones,
        "style": styles,
        "popularity": scale_popularity(float(detail.get("popularity") or 0)),
        "qualityScore": round(tmdb_rating * 10, 2),
        "familiarity": familiarity_score(float(detail.get("popularity") or 0), int(detail.get("vote_count") or 0)),
        "imdbRating": imdb_rating,
        "tmdbRating": tmdb_rating,
        "watchProviders": extract_watch_providers(detail.get("watch/providers", {}), region),
        "posterUrl": f"{TMDB_IMAGE_BASE}{poster_path}",
    }


def normalize_series(summary: dict[str, Any], detail: dict[str, Any], region: str) -> dict[str, Any] | None:
    title = detail.get("name") or summary.get("name")
    year = first_year(detail.get("first_air_date") or summary.get("first_air_date"))
    poster_path = detail.get("poster_path") or summary.get("poster_path")
    cast = [item["name"] for item in detail.get("credits", {}).get("cast", [])[:3] if item.get("name")]
    creators = [item["name"] for item in detail.get("created_by", []) if item.get("name")]
    keywords = [item["name"] for item in detail.get("keywords", {}).get("results", []) if item.get("name")][:8]
    genres = [item["name"] for item in detail.get("genres", []) if item.get("name")]
    overview = detail.get("overview") or summary.get("overview") or ""

    if not title or not year or not poster_path or not overview or not cast or not genres:
        return None

    tones, styles = derive_tags(genres, keywords, overview)
    tmdb_rating = round(float(detail.get("vote_average") or 0), 1)
    external_ids = detail.get("external_ids", {})
    imdb_id = external_ids.get("imdb_id")
    episode_runtimes = detail.get("episode_run_time") or []

    imdb_rating = request_omdb_rating(imdb_id)
    trailer_key = extract_trailer_key(detail.get("videos", {}))

    return {
        "id": f"{slugify(title)}_{year}_{detail['id']}",
        "tmdbId": detail["id"],
        "trailerKey": trailer_key,
        "imdbId": imdb_id,
        "imdbUrl": f"https://www.imdb.com/title/{imdb_id}/" if imdb_id else None,
        "title": title,
        "year": year,
        "kind": "series",
        "language": "en",
        "originalLanguage": detail.get("original_language"),
        "localizedLanguages": spoken_language_names(detail),
        "runtime": int(episode_runtimes[0] if episode_runtimes else 0),
        "seasons": int(detail.get("number_of_seasons") or 0),
        "certification": extract_tv_certification(detail.get("content_ratings", {}), region),
        "genres": genres,
        "subgenres": keywords[:3] or genres[:2],
        "keywords": keywords,
        "cast": cast,
        "director": creators[0] if creators else None,
        "synopsis": overview,
        "tone": tones,
        "style": styles,
        "popularity": scale_popularity(float(detail.get("popularity") or 0)),
        "qualityScore": round(tmdb_rating * 10, 2),
        "familiarity": familiarity_score(float(detail.get("popularity") or 0), int(detail.get("vote_count") or 0)),
        "imdbRating": imdb_rating,
        "tmdbRating": tmdb_rating,
        "watchProviders": extract_watch_providers(detail.get("watch/providers", {}), region),
        "posterUrl": f"{TMDB_IMAGE_BASE}{poster_path}",
    }


def collect_summaries(kind: str, limit: int, max_pages: int, request_delay: float) -> list[dict[str, Any]]:
    feed_configs = {
        "movie": [
            (
                "popular-discover",
                "/discover/movie",
                {
                    "include_adult": "false",
                    "sort_by": "popularity.desc",
                    "vote_count.gte": 350,
                    "with_original_language": "en",
                },
                5,
            ),
            (
                "top-rated",
                "/movie/top_rated",
                {"language": "en-US"},
                2,
            ),
            (
                "trending",
                "/trending/movie/week",
                {"language": "en-US"},
                2,
            ),
            (
                "now-playing",
                "/movie/now_playing",
                {"language": "en-US", "region": "US"},
                2,
            ),
            (
                "upcoming",
                "/movie/upcoming",
                {"language": "en-US", "region": "US"},
                2,
            ),
        ],
        "series": [
            (
                "popular-discover",
                "/discover/tv",
                {
                    "include_adult": "false",
                    "sort_by": "popularity.desc",
                    "vote_count.gte": 120,
                    "with_original_language": "en",
                },
                5,
            ),
            (
                "top-rated",
                "/tv/top_rated",
                {"language": "en-US"},
                2,
            ),
            (
                "trending",
                "/trending/tv/week",
                {"language": "en-US"},
                2,
            ),
            (
                "on-the-air",
                "/tv/on_the_air",
                {"language": "en-US"},
                2,
            ),
            (
                "airing-today",
                "/tv/airing_today",
                {"language": "en-US"},
                1,
            ),
        ],
    }

    configs = feed_configs[kind]
    target_counts = chunked_target_counts(limit, [weight for _, _, _, weight in configs])
    summaries_by_id: dict[int, dict[str, Any]] = {}
    label = "movies" if kind == "movie" else "series"

    for (feed_label, endpoint, base_params, _weight), target_count in zip(configs, target_counts):
        if target_count <= 0:
            continue

        page = 1
        collected_for_feed = 0
        while collected_for_feed < target_count and page <= max_pages:
            params = dict(base_params)
            params["page"] = page
            payload = request_json(endpoint, params)

            page_results = payload.get("results", [])
            before = len(summaries_by_id)
            for item in page_results:
                title_id = item.get("id")
                if not title_id:
                    continue
                if (item.get("original_language") or "").lower() != "en":
                    continue
                summaries_by_id.setdefault(title_id, item)

            added = len(summaries_by_id) - before
            collected_for_feed += added
            print(
                f"Fetched {label} feed {feed_label} page {page}; "
                f"{min(collected_for_feed, target_count)}/{target_count} unique items from this feed."
            )
            if not page_results:
                break
            page += 1
            time.sleep(request_delay)

    ordered = sorted(
        summaries_by_id.values(),
        key=lambda item: (
            -float(item.get("popularity") or 0),
            -(item.get("vote_count") or 0),
            item.get("title") or item.get("name") or "",
        ),
    )
    return ordered[:limit]


def collect_catalog(limit: int, region: str, max_pages: int, request_delay: float) -> list[dict[str, Any]]:
    movie_limit = limit // 2
    series_limit = limit - movie_limit
    output: list[dict[str, Any]] = []

    movie_summaries = collect_summaries("movie", movie_limit, max_pages, request_delay)
    series_summaries = collect_summaries("series", series_limit, max_pages, request_delay)

    for index, summary in enumerate(movie_summaries, start=1):
        try:
            # detail = request_json(
            #     f"/movie/{summary['id']}",
            #     {"append_to_response": "credits,keywords,release_dates,watch/providers,external_ids"},
            # )

            detail = request_json(
                f"/movie/{summary['id']}",
                {
                    "append_to_response": "credits,keywords,release_dates,watch/providers,external_ids,videos"
                },
            )
        except RequestFailedError as error:
            print(f"Skipping movie {summary.get('id')}: {error}")
            continue
        normalized = normalize_movie(summary, detail, region)
        if normalized:
            output.append(normalized)
        if index % 25 == 0 or index == len(movie_summaries):
            print(f"Normalized movies: {index}/{len(movie_summaries)} processed, {len(output)} kept.")
        time.sleep(request_delay)

    movie_count = len(output)
    for index, summary in enumerate(series_summaries, start=1):
        try:
            # detail = request_json(
            #     f"/tv/{summary['id']}",
            #     {"append_to_response": "credits,keywords,content_ratings,watch/providers,external_ids"},
            # )

            detail = request_json(
                f"/tv/{summary['id']}",
                {
                    "append_to_response": "credits,keywords,content_ratings,watch/providers,external_ids,videos"
                },
            )

        except RequestFailedError as error:
            print(f"Skipping series {summary.get('id')}: {error}")
            continue
        normalized = normalize_series(summary, detail, region)
        if normalized:
            output.append(normalized)
        if index % 25 == 0 or index == len(series_summaries):
            series_count = len(output) - movie_count
            print(f"Normalized series: {index}/{len(series_summaries)} processed, {series_count} kept.")
        time.sleep(request_delay)

    return sorted(output, key=lambda item: (item["kind"], -item["popularity"], item["title"]))


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a local recommender catalog from TMDB.")
    parser.add_argument("--limit", type=int, default=DEFAULT_CATALOG_LIMIT, help="Target number of normalized titles.")
    parser.add_argument("--region", default=os.environ.get("WATCH_REGION", "US"), help="Watch provider region.")
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES, help="Maximum TMDB pages per feed.")
    parser.add_argument("--request-delay", type=float, default=DEFAULT_REQUEST_DELAY, help="Delay between TMDB requests in seconds.")
    parser.add_argument(
        "--output",
        default="data/seeds/english_titles.generated.json",
        help="Output JSON path, relative to the repo root unless absolute.",
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = ROOT / output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)

    catalog = collect_catalog(args.limit, args.region.upper(), args.max_pages, args.request_delay)
    output_path.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    print(f"Wrote {len(catalog)} titles to {output_path}")


if __name__ == "__main__":
    main()
