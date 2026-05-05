export type ContentKind = "movie" | "series";
export type ContentMode = ContentKind | "either";
export type AdventureLevel = "safe" | "balanced" | "surprise";
export type FeedbackValue = "like" | "dislike" | "not_seen";

export type SessionPreferences = {
  contentMode: ContentMode;
  adventureLevel: AdventureLevel;
};

export type Title = {
  id: string;
  tmdbId?: number;
  imdbId?: string;
  imdbUrl?: string;
  title: string;
  year: number;
  kind: ContentKind;
  language: string;
  originalLanguage?: string;
  localizedLanguages?: string[];
  runtime: number;
  seasons?: number;
  certification: string;
  genres: string[];
  subgenres: string[];
  keywords: string[];
  cast: string[];
  director?: string;
  synopsis: string;
  tone: string[];
  style: string[];
  popularity: number;
  qualityScore: number;
  familiarity: number;
  imdbRating?: number;
  tmdbRating?: number;
  watchProviders?: string[];
  posterUrl: string;
};

export type SessionTitle = {
  title: Title;
  step: number;
  confidence: number;
};

export type SessionEvent = {
  titleId: string;
  value: FeedbackValue;
  step: number;
};

export type RecommendationReason = {
  label: string;
  detail: string;
};

export type RecommendationResult = {
  hero: Title;
  backups: Title[];
  reasons: RecommendationReason[];
  confidence: number;
  summary: string;
};

export type SessionState = {
  sessionId: string;
  preferences: SessionPreferences;
  shownTitleIds: string[];
  events: SessionEvent[];
  confidence: number;
  nextTitle?: SessionTitle;
  finalRecommendation?: RecommendationResult;
};
