import type { AdventureLevel, ContentMode, FeedbackValue, RecommendationResult, SessionTitleResponse } from "./types";

async function apiFetch<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed: ${response.status}`;

    try {
      const payload = JSON.parse(text) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        message = payload.detail;
      }
    } catch {
      // Keep the raw response text when the API does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function startSession(input: { contentMode: ContentMode; adventureLevel: AdventureLevel }) {
  return apiFetch<SessionTitleResponse>("/api/session/start", input);
}

export function submitFeedback(input: { sessionId: string; titleId: string; value: FeedbackValue }) {
  return apiFetch<SessionTitleResponse>("/api/session/feedback", input);
}

export function stopSession(sessionId: string) {
  return apiFetch<RecommendationResult>("/api/session/stop", { sessionId });
}

export function healthcheck() {
  return apiFetch<{ ok: boolean; catalogSize: number }>("/api/health");
}
