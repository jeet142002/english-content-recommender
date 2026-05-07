const configuredApiBaseUrl =
  process.env.RECOMMENDER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_RECOMMENDER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL;

const REC_API_BASE = (configuredApiBaseUrl ?? "http://localhost:8000").replace(/\/$/, "");

export async function proxyToRecommender(path: string, init?: RequestInit) {
  if (!configuredApiBaseUrl && process.env.VERCEL) {
    return Response.json(
      {
        detail:
          "RECOMMENDER_API_BASE_URL is not configured for the web deployment. Set it to your Railway backend URL.",
      },
      { status: 500 },
    );
  }

  try {
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
  } catch {
    return Response.json(
      { detail: `Unable to reach recommender API at ${REC_API_BASE}.` },
      { status: 502 },
    );
  }
}
