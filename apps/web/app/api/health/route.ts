import { proxyToRecommender } from "@/lib/server-api";

export async function GET() {
  return proxyToRecommender("/health");
}
