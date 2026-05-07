import type {
  AdventureLevel,
  ContentMode,
  FeedbackValue,
  RecommendationResult,
  SessionTitleResponse,
} from "./types";

const directApiBaseUrl = process.env.NEXT_PUBLIC_RECOMMENDER_API_BASE_URL?.replace(/\/$/, "");
const BASE_URL = directApiBaseUrl || "/api";

async function apiFetch<T>(path: string, body?: object): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
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
      // ignore JSON parse errors
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function startSession(input: {
  contentMode: ContentMode;
  adventureLevel: AdventureLevel;
}) {
  return apiFetch<SessionTitleResponse>("/session/start", input);
}

export function submitFeedback(input: {
  sessionId: string;
  titleId: string;
  value: FeedbackValue;
}) {
  return apiFetch<SessionTitleResponse>("/session/feedback", input);
}

export function stopSession(sessionId: string) {
  return apiFetch<RecommendationResult>("/session/stop", { sessionId });
}

export function healthcheck() {
  return apiFetch<{ ok: boolean; catalogSize: number; sessionStore?: string }>("/health");
}
