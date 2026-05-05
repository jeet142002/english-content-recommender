export type ContentKind = "movie" | "series";
export type ContentMode = ContentKind | "either";
export type AdventureLevel = "safe" | "balanced" | "surprise";
export type FeedbackValue = "like" | "dislike" | "not_seen";

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

export type SessionTitleResponse = {
  sessionId: string;
  step: number;
  confidence: number;
  title: Title;
};

export type RecommendationReason = {
  label: string;
  detail: string;
};

export type RecommendationResult = {
  sessionId: string;
  confidence: number;
  hero: Title;
  backups: Title[];
  reasons: RecommendationReason[];
  summary: string;
};
