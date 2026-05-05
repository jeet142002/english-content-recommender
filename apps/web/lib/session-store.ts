"use client";

import { create } from "zustand";

import type { AdventureLevel, ContentMode, RecommendationResult, SessionTitleResponse } from "./types";

type SessionStore = {
  sessionId: string | null;
  contentMode: ContentMode;
  adventureLevel: AdventureLevel;
  currentTitle: SessionTitleResponse | null;
  recommendation: RecommendationResult | null;
  loading: boolean;
  error: string | null;
  setPreferences: (contentMode: ContentMode, adventureLevel: AdventureLevel) => void;
  setLoading: (value: boolean) => void;
  setCurrentTitle: (value: SessionTitleResponse | null) => void;
  setRecommendation: (value: RecommendationResult | null) => void;
  setError: (value: string | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  contentMode: "either",
  adventureLevel: "balanced",
  currentTitle: null,
  recommendation: null,
  loading: false,
  error: null,
  setPreferences: (contentMode, adventureLevel) => set({ contentMode, adventureLevel }),
  setLoading: (loading) => set({ loading }),
  setCurrentTitle: (currentTitle) =>
    set({
      currentTitle,
      sessionId: currentTitle?.sessionId ?? null,
      recommendation: null,
    }),
  setRecommendation: (recommendation) => set({ recommendation }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      sessionId: null,
      contentMode: "either",
      adventureLevel: "balanced",
      currentTitle: null,
      recommendation: null,
      loading: false,
      error: null,
    }),
}));
