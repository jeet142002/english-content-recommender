const REC_API_BASE = process.env.RECOMMENDER_API_BASE_URL ?? "http://localhost:8000";

export async function proxyToRecommender(path: string, init?: RequestInit) {
  const response = await fetch(`${REC_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
