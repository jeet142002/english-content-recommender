from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


ContentKind = Literal["movie", "series"]
ContentMode = Literal["movie", "series", "either"]
AdventureLevel = Literal["safe", "balanced", "surprise"]
FeedbackValue = Literal["like", "dislike", "not_seen"]


class SessionPreferences(BaseModel):
    contentMode: ContentMode = "either"
    adventureLevel: AdventureLevel = "balanced"


class Title(BaseModel):
    id: str
    tmdbId: int | None = None
    imdbId: str | None = None
    imdbUrl: str | None = None
    title: str
    year: int
    kind: ContentKind
    language: str
    originalLanguage: str | None = None
    localizedLanguages: list[str] = Field(default_factory=list)
    runtime: int
    seasons: int | None = None
    certification: str
    genres: list[str]
    subgenres: list[str]
    keywords: list[str]
    cast: list[str]
    director: str | None = None
    synopsis: str
    tone: list[str]
    style: list[str]
    popularity: float
    qualityScore: float
    familiarity: float
    imdbRating: float | None = None
    tmdbRating: float | None = None
    watchProviders: list[str] = Field(default_factory=list)
    posterUrl: str


class SessionEvent(BaseModel):
    titleId: str
    value: FeedbackValue
    step: int


class SessionState(BaseModel):
    sessionId: str
    preferences: SessionPreferences
    shownTitleIds: list[str] = Field(default_factory=list)
    events: list[SessionEvent] = Field(default_factory=list)
    confidence: float = 0.0
    profile: dict[str, float] = Field(default_factory=dict)


class SessionTitleResponse(BaseModel):
    sessionId: str
    step: int
    confidence: float
    title: Title


class RecommendationReason(BaseModel):
    label: str
    detail: str


class RecommendationResult(BaseModel):
    sessionId: str
    confidence: float
    hero: Title
    backups: list[Title]
    reasons: list[RecommendationReason]
    summary: str


class StartSessionRequest(BaseModel):
    contentMode: ContentMode = "either"
    adventureLevel: AdventureLevel = "balanced"


class FeedbackRequest(BaseModel):
    sessionId: str
    titleId: str
    value: FeedbackValue


class StopRequest(BaseModel):
    sessionId: str
