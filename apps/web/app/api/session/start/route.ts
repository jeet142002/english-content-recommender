import { proxyToRecommender } from "@/lib/server-api";

export async function POST(request: Request) {
  return proxyToRecommender("/session/start", {
    method: "POST",
    body: await request.text(),
  });
}
