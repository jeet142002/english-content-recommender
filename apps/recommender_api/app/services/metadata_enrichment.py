from __future__ import annotations

import re
from dataclasses import dataclass


GENERIC_KEYWORD_BLACKLIST = {
    "based on novel or book",
    "based on comic",
    "duringcreditsstinger",
    "woman director",
    "tv special",
    "tv movie",
    "miniseries",
    "miniserie",
    "3d animation",
    "adult animation",
    "cgi animation",
    "showbiz",
    "foreboding",
    "survival instinct",
}

KEYWORD_HINT_TERMS = {
    "detective",
    "murder",
    "heist",
    "time travel",
    "friendship",
    "romance",
    "courtroom",
    "lawyer",
    "doctor",
    "hospital",
    "school",
    "high school",
    "college",
    "supernatural",
    "witch",
    "vampire",
    "sports",
    "war",
    "space",
    "alien",
    "survival",
    "spy",
    "police",
    "chef",
    "music",
    "band",
    "family",
    "workplace",
    "office",
    "competition",
}

STORY_TAG_RULES = [
    ("coming-of-age", ["coming of age", "teen", "teenager", "high school", "college"]),
    ("workplace", ["office", "workplace", "coworker", "boss", "company", "corporate"]),
    ("supernatural", ["supernatural", "ghost", "witch", "demon", "vampire", "magic"]),
    ("time-travel", ["time travel", "time loop", "alternate timeline", "parallel universe"]),
    ("courtroom", ["courtroom", "lawyer", "attorney", "trial", "judge"]),
    ("medical", ["doctor", "hospital", "surgery", "medical", "nurse"]),
    ("police", ["detective", "police", "fbi", "cia", "crime scene", "investigation"]),
    ("heist", ["heist", "robbery", "con artist", "getaway"]),
    ("survival", ["survival", "wilderness", "stranded", "post-apocalyptic"]),
    ("space-opera", ["space war", "galaxy", "interstellar", "space opera", "starship"]),
    ("sports", ["sports", "athlete", "football", "basketball", "boxing", "mma"]),
    ("romance", ["romance", "love story", "falling in love", "wedding"]),
    ("family-saga", ["family saga", "generational", "siblings", "parents", "legacy"]),
    ("competition", ["competition", "tournament", "reality competition", "contest"]),
    ("political", ["political", "election", "government", "senator", "president"]),
    ("historical", ["historical", "period drama", "world war", "empire"]),
]


@dataclass(frozen=True)
class EnrichedMetadata:
    keywords: list[str]
    subgenres: list[str]
    tone: list[str]
    style: list[str]
    editorial_tags: list[str]


def enrich_metadata(
    *,
    title: str,
    kind: str,
    genres: list[str],
    subgenres: list[str],
    keywords: list[str],
    overview: str,
    tone: list[str],
    style: list[str],
    certification: str,
    runtime: int,
    seasons: int | None,
    quality_score: float,
    popularity: float,
    familiarity: float,
) -> EnrichedMetadata:
    cleaned_keywords = clean_keywords(title, genres, keywords, overview)
    story_tags = derive_story_tags(genres, cleaned_keywords, overview)
    merged_tone = merge_tags(
        tone,
        [*derive_base_tones(genres, cleaned_keywords, overview), *derive_extra_tones(genres, cleaned_keywords, overview)],
        fallback=["engaging"],
        limit=4,
    )
    merged_style = merge_tags(
        style,
        [*derive_base_styles(genres, cleaned_keywords, overview), *derive_extra_styles(genres, cleaned_keywords, overview)],
        fallback=["mainstream"],
        limit=4,
    )
    editorial_tags = derive_editorial_tags(
        kind=kind,
        genres=genres,
        keywords=cleaned_keywords,
        overview=overview,
        tone=merged_tone,
        style=merged_style,
        certification=certification,
        runtime=runtime,
        seasons=seasons,
        quality_score=quality_score,
        popularity=popularity,
        familiarity=familiarity,
    )
    merged_subgenres = merge_tags(story_tags, cleaned_keywords, fallback=subgenres or genres[:2], limit=4)
    return EnrichedMetadata(
        keywords=cleaned_keywords,
        subgenres=merged_subgenres,
        tone=merged_tone,
        style=merged_style,
        editorial_tags=editorial_tags,
    )


def clean_keywords(title: str, genres: list[str], keywords: list[str], overview: str) -> list[str]:
    genre_tokens = {genre.lower() for genre in genres}
    haystack = normalize_text(" ".join([title, *genres, overview]))
    scored: list[tuple[float, str]] = []
    for keyword in keywords:
        normalized = normalize_text(keyword)
        if not normalized or normalized in GENERIC_KEYWORD_BLACKLIST:
            continue
        if normalized == normalize_text(title) or normalized in genre_tokens:
            continue
        if len(normalized) <= 2 or normalized.isdigit():
            continue

        score = 1.0
        words = normalized.split()
        if 1 < len(words) <= 3:
            score += 0.45
        if normalized in haystack:
            score += 0.65
        if any(term in normalized for term in KEYWORD_HINT_TERMS):
            score += 0.55
        if len(normalized) > 32:
            score -= 0.25
        if "," in normalized:
            score -= 0.15
        if re.search(r"\b(part|chapter|episode)\b", normalized):
            score -= 0.2
        scored.append((score, keyword.strip()))

    scored.sort(key=lambda item: (-item[0], len(item[1]), item[1].lower()))
    cleaned = dedupe_preserve_order(value for _, value in scored)
    return cleaned[:6]


def derive_story_tags(genres: list[str], keywords: list[str], overview: str) -> list[str]:
    haystack = normalize_text(" ".join([*genres, *keywords, overview]))
    matched = [label for label, terms in STORY_TAG_RULES if any(term in haystack for term in terms)]
    if "Science Fiction" in genres and "space-opera" not in matched:
        if any(term in haystack for term in ["space", "alien", "galaxy", "future"]):
            matched.append("space-opera")
    if "Mystery" in genres and "police" not in matched and any(term in haystack for term in ["detective", "crime", "investigation"]):
        matched.append("police")
    return dedupe_preserve_order(matched)[:4]


def derive_extra_tones(genres: list[str], keywords: list[str], overview: str) -> list[str]:
    haystack = normalize_text(" ".join([*genres, *keywords, overview]))
    tones: list[str] = []
    if any(term in haystack for term in ["uplifting", "feel-good", "hope", "friendship", "kindness", "heartwarming"]):
        tones.append("hopeful")
    if any(term in haystack for term in ["gritty", "crime", "revenge", "corrupt", "gang", "prison"]):
        tones.append("gritty")
    if any(term in haystack for term in ["dream", "surreal", "mind-bending", "parallel universe"]):
        tones.append("surreal")
    if any(term in haystack for term in ["calm", "gentle", "slow life", "nature", "travel"]):
        tones.append("calm")
    return tones[:2]


def derive_base_tones(genres: list[str], keywords: list[str], overview: str) -> list[str]:
    haystack = normalize_text(" ".join([*genres, *keywords, overview]))
    tone_rules = [
        ("dark", ["murder", "crime", "killer", "violent", "revenge", "war", "horror"]),
        ("funny", ["comedy", "sitcom", "funny", "comic"]),
        ("tense", ["thriller", "survival", "mystery", "suspense"]),
        ("emotional", ["drama", "family", "grief", "romance"]),
        ("epic", ["fantasy", "adventure", "space", "saga"]),
        ("cerebral", ["science fiction", "mystery", "psychological", "mind"]),
        ("warm", ["family", "friendship", "heart", "kindness"]),
    ]
    return [label for label, terms in tone_rules if any(term in haystack for term in terms)][:3]


def derive_extra_styles(genres: list[str], keywords: list[str], overview: str) -> list[str]:
    haystack = normalize_text(" ".join([*genres, *keywords, overview]))
    styles: list[str] = []
    if any(term in haystack for term in ["anthology", "sketch", "variety", "talk show"]):
        styles.append("episodic")
    if any(term in haystack for term in ["investigation", "case", "detective", "hospital", "lawyer", "police"]):
        styles.append("procedural")
    if any(term in haystack for term in ["ensemble", "group", "team", "friends", "family"]):
        styles.append("ensemble")
    if any(term in haystack for term in ["based on true story", "historical", "biography", "period"]):
        styles.append("grounded")
    return styles[:2]


def derive_base_styles(genres: list[str], keywords: list[str], overview: str) -> list[str]:
    haystack = normalize_text(" ".join([*genres, *keywords, overview]))
    style_rules = [
        ("prestige", ["drama", "historical", "biography", "award"]),
        ("fast-paced", ["action", "adventure", "thriller"]),
        ("slow-burn", ["mystery", "psychological", "investigation"]),
        ("world-building", ["fantasy", "science fiction", "dystopian"]),
        ("character-driven", ["drama", "family", "romance"]),
        ("accessible", ["comedy", "family", "animation"]),
    ]
    return [label for label, terms in style_rules if any(term in haystack for term in terms)][:3]


def derive_editorial_tags(
    *,
    kind: str,
    genres: list[str],
    keywords: list[str],
    overview: str,
    tone: list[str],
    style: list[str],
    certification: str,
    runtime: int,
    seasons: int | None,
    quality_score: float,
    popularity: float,
    familiarity: float,
) -> list[str]:
    haystack = normalize_text(" ".join([*genres, *keywords, overview, *tone, *style]))
    tags: list[str] = []
    high_intensity_markers = ["action", "thriller", "war", "survival", "tense", "gritty", "crime", "horror"]
    low_intensity_markers = ["family", "documentary", "calm", "warm", "friendship", "gentle", "sitcom"]

    if any(term in haystack for term in ["franchise", "sequel", "prequel", "cinematic universe", "superhero", "spin off"]):
        tags.append("franchise")
    if (
        any(genre in genres for genre in ["Comedy", "Family", "Animation"])
        or any(term in haystack for term in ["feel-good", "warm", "funny", "friendship"])
    ) and not any(term in haystack for term in high_intensity_markers):
        tags.append("comfort-viewing")
    if (
        quality_score >= 82
        and (
            "prestige" in style
            or any(genre in genres for genre in ["Drama", "Documentary", "History", "War", "Mystery"])
            or any(term in haystack for term in ["historical", "biography", "awards", "period drama"])
        )
        and not any(genre in genres for genre in ["Reality", "Talk", "Family"])
    ):
        tags.append("prestige")
    if any(term in haystack for term in ["procedural", "detective", "case", "medical", "hospital", "lawyer", "police", "investigation"]):
        tags.append("procedural")

    if any(term in haystack for term in high_intensity_markers):
        tags.append("high-intensity")
    elif any(term in haystack for term in low_intensity_markers):
        tags.append("low-intensity")
    else:
        tags.append("medium-intensity")

    if certification in {"G", "PG", "TV-G", "TV-PG"} or any(genre in genres for genre in ["Family", "Animation"]):
        tags.append("family-friendly")

    if kind == "series":
        if "procedural" in tags or any(term in haystack for term in ["episodic", "sitcom", "talk", "variety", "competition"]):
            tags.append("episodic")
        elif any(term in haystack for term in ["serialized", "saga", "mystery", "fantasy", "drama", "thriller"]):
            tags.append("serialized")
        if seasons and seasons >= 4:
            tags.append("long-run")

    if runtime and runtime <= 35 and kind == "series":
        tags.append("easy-commit")
    if runtime and runtime >= 130:
        tags.append("epic-runtime")

    if any(term in haystack for term in ["ensemble", "team", "friends", "family", "group", "band"]):
        tags.append("ensemble")
    if any(term in haystack for term in ["competition", "contest", "reality competition"]):
        tags.append("competition")

    if popularity >= 55 or familiarity >= 60:
        tags.append("mainstream")
    elif popularity <= 12 and familiarity <= 20:
        tags.append("underseen")

    return dedupe_preserve_order(tags)[:7]


def merge_tags(
    primary: list[str],
    secondary: list[str],
    *,
    fallback: list[str] | None = None,
    limit: int,
) -> list[str]:
    merged = dedupe_preserve_order([*primary, *secondary])
    if merged:
        return merged[:limit]
    return dedupe_preserve_order(fallback or [])[:limit]


def dedupe_preserve_order(values) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        normalized = normalize_text(value)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        output.append(value.strip())
    return output


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())
