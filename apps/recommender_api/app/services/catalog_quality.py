from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass


NON_ASCII_EXCEPTION_CHARS = {"’", "'", "-", ":", "&", "!", "?", ",", "."}
WEAK_SUPPORT_QUALITY_FLOOR = 82


@dataclass(frozen=True)
class CatalogQualityAssessment:
    english_confidence: float
    title_cleanliness: float
    support_score: float
    trust_score: float
    trust_flags: list[str]
    keep_in_catalog: bool


def assess_catalog_entry(
    *,
    title: str,
    original_language: str | None,
    localized_languages: list[str],
    quality_score: float,
    popularity: float,
    familiarity: float,
    synopsis: str,
) -> CatalogQualityAssessment:
    trust_flags: list[str] = []
    english_confidence = _english_confidence(title, original_language, localized_languages, trust_flags)
    title_cleanliness = _title_cleanliness(title, trust_flags)
    support_score = _support_score(quality_score, popularity, familiarity, synopsis, trust_flags)

    trust_score = (
        english_confidence * 0.44
        + title_cleanliness * 0.24
        + support_score * 0.32
    )

    if english_confidence < 0.45:
        trust_flags.append("weak_english_confidence")
    if title_cleanliness < 0.42:
        trust_flags.append("messy_title")
    if support_score < 0.34:
        trust_flags.append("weak_support")

    keep_in_catalog = (
        quality_score > 0
        and english_confidence >= 0.52
        and title_cleanliness >= 0.45
        and trust_score >= 0.4
        and "foreign_title_without_english_support" not in trust_flags
    )

    return CatalogQualityAssessment(
        english_confidence=round(max(0.0, min(1.0, english_confidence)), 3),
        title_cleanliness=round(max(0.0, min(1.0, title_cleanliness)), 3),
        support_score=round(max(0.0, min(1.0, support_score)), 3),
        trust_score=round(max(0.0, min(1.0, trust_score)), 3),
        trust_flags=_dedupe(trust_flags),
        keep_in_catalog=keep_in_catalog,
    )


def _english_confidence(
    title: str,
    original_language: str | None,
    localized_languages: list[str],
    trust_flags: list[str],
) -> float:
    score = 0.15
    original = (original_language or "").strip().lower()
    normalized_locales = {language.strip().lower() for language in localized_languages if language.strip()}
    title_ascii_ratio = _ascii_ratio(title)

    if original == "en":
        score += 0.45
    elif original:
        trust_flags.append("non_english_original_language")
        score -= 0.15

    if "english" in normalized_locales:
        score += 0.28
    elif normalized_locales:
        score -= 0.14

    if title_ascii_ratio >= 0.94:
        score += 0.16
    elif title_ascii_ratio < 0.75:
        score -= 0.22

    if title_ascii_ratio < 0.78 and "english" not in normalized_locales:
        trust_flags.append("foreign_title_without_english_support")

    return score


def _title_cleanliness(title: str, trust_flags: list[str]) -> float:
    stripped = title.strip()
    if not stripped:
        trust_flags.append("empty_title")
        return 0.0

    score = 0.9
    ascii_ratio = _ascii_ratio(stripped)
    weird_chars = [
        char
        for char in stripped
        if ord(char) > 127 and char not in NON_ASCII_EXCEPTION_CHARS and not unicodedata.category(char).startswith("L")
    ]
    if weird_chars:
        score -= 0.18
    if ascii_ratio < 0.82:
        score -= 0.22
    if re.search(r"[¿¡]", stripped):
        score -= 0.28
    if re.search(r"\s{2,}", stripped):
        score -= 0.08
    if stripped.islower() or stripped.isupper():
        score -= 0.06
    if len(stripped) < 2:
        score -= 0.25
    if re.search(r"[^\w\s'’:,\-!?.&/]", stripped):
        score -= 0.08

    if score < 0.55:
        trust_flags.append("title_cleanliness_concern")
    return score


def _support_score(
    quality_score: float,
    popularity: float,
    familiarity: float,
    synopsis: str,
    trust_flags: list[str],
) -> float:
    if quality_score <= 0:
        trust_flags.append("missing_quality_score")
        return 0.0

    quality = max(0.0, min(1.0, quality_score / 100))
    popularity_component = math.sqrt(max(0.0, popularity / 100))
    familiarity_component = math.sqrt(max(0.0, familiarity / 100))
    synopsis_bonus = 0.08 if len((synopsis or "").strip()) >= 120 else 0.0
    score = quality * 0.34 + popularity_component * 0.24 + familiarity_component * 0.34 + synopsis_bonus

    if quality_score >= 95 and familiarity < 5 and popularity < 8:
        trust_flags.append("low_support_high_quality")
        score -= 0.16
    elif quality_score >= WEAK_SUPPORT_QUALITY_FLOOR and familiarity < 10 and popularity < 15:
        trust_flags.append("low_support_title")
        score -= 0.08

    if familiarity < 2 and popularity < 3:
        trust_flags.append("extremely_obscure")
        score -= 0.1

    return score


def _ascii_ratio(value: str) -> float:
    if not value:
        return 0.0
    ascii_count = sum(1 for char in value if ord(char) < 128)
    return ascii_count / len(value)


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        output.append(value)
    return output
