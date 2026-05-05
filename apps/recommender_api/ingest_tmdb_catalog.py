from __future__ import annotations

import argparse
import json
import os
import re
import socket
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
TMDB_API_BASE = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
OMDB_API_BASE = "https://www.omdbapi.com/"
REQUEST_TIMEOUT_SECONDS = 30


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


def request_json(
    path: str,
    params: dict[str, object] | None = None,
    *,
    retries: int = 5,
) -> dict[str, Any]:
    api_key = os.environ.get("TMDB_API_KEY")
    api_token = os.environ.get("TMDB_API_TOKEN")
    auth_value = api_token or api_key
    if not auth_value:
        raise RuntimeError("TMDB_API_KEY or TMDB_API_TOKEN is required to ingest a generated catalog.")

    query_params = dict(params or {})
    headers = {
        "Accept": "application/json",
        "User-Agent": "english-content-recommender/0.1",
    }
    if api_token or is_bearer_token(auth_value):
        headers["Authorization"] = f"Bearer {auth_value}"
    else:
        query_params["api_key"] = auth_value

    query = urlencode(query_params)
    request = Request(f"{TMDB_API_BASE}{path}?{query}", headers=headers)

    for attempt in range(1, retries + 1):
        try:
            with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code in {429, 500, 502, 503, 504} and attempt < retries:
                print(f"TMDB {error.code} for {path}; retrying {attempt}/{retries - 1}...")
                sleep_for_retry(attempt, error.headers.get("Retry-After"))
                continue
            raise RequestFailedError(f"TMDB request failed for {path}: HTTP {error.code}") from error
        except (ConnectionResetError, TimeoutError, URLError, socket.timeout) as error:
            if attempt < retries:
                print(f"Network error for {path}: {error}; retrying {attempt}/{retries - 1}...")
                sleep_for_retry(attempt)
                continue
            raise RequestFailedError(f"TMDB request failed for {path} after {retries} attempts: {error}") from error

    raise RequestFailedError(f"TMDB request failed for {path}")


def request_omdb_rating(imdb_id: str | None) -> float | None:
    api_key = os.environ.get("OMDB_API_KEY")
    if not api_key or not imdb_id:
        return None

    query = urlencode({"apikey": api_key, "i": imdb_id})
    request = Request(f"{OMDB_API_BASE}?{query}", headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    rating = payload.get("imdbRating")
    if not rating or rating == "N/A":
        return None
    return float(rating)


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

    return {
        "id": f"{slugify(title)}_{year}_{detail['id']}",
        "tmdbId": detail["id"],
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

    return {
        "id": f"{slugify(title)}_{year}_{detail['id']}",
        "tmdbId": detail["id"],
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
    endpoint = "/discover/movie" if kind == "movie" else "/discover/tv"
    vote_floor = 500 if kind == "movie" else 200
    summaries: list[dict[str, Any]] = []
    page = 1
    label = "movies" if kind == "movie" else "series"

    while len(summaries) < limit and page <= max_pages:
        payload = request_json(
            endpoint,
            {
                "include_adult": "false",
                "sort_by": "popularity.desc",
                "vote_count.gte": vote_floor,
                "with_original_language": "en",
                "page": page,
            },
        )
        summaries.extend(payload.get("results", []))
        print(f"Fetched {label} discovery page {page}; {min(len(summaries), limit)}/{limit} summaries.")
        page += 1
        time.sleep(request_delay)

    return summaries[:limit]


def collect_catalog(limit: int, region: str, max_pages: int, request_delay: float) -> list[dict[str, Any]]:
    movie_limit = limit // 2
    series_limit = limit - movie_limit
    output: list[dict[str, Any]] = []

    movie_summaries = collect_summaries("movie", movie_limit, max_pages, request_delay)
    series_summaries = collect_summaries("series", series_limit, max_pages, request_delay)

    for index, summary in enumerate(movie_summaries, start=1):
        try:
            detail = request_json(
                f"/movie/{summary['id']}",
                {"append_to_response": "credits,keywords,release_dates,watch/providers,external_ids"},
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
            detail = request_json(
                f"/tv/{summary['id']}",
                {"append_to_response": "credits,keywords,content_ratings,watch/providers,external_ids"},
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
    parser.add_argument("--limit", type=int, default=120, help="Target number of normalized titles.")
    parser.add_argument("--region", default=os.environ.get("WATCH_REGION", "US"), help="Watch provider region.")
    parser.add_argument("--max-pages", type=int, default=50, help="Maximum TMDB discovery pages per content type.")
    parser.add_argument("--request-delay", type=float, default=0.35, help="Delay between TMDB requests in seconds.")
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
