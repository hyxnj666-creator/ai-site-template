/**
 * GET /api/agent/sessions
 *
 * Returns the Agent OS system snapshot:
 *   - activeSessions / runsToday / toolCallsToday / tokensToday / avgLatencyMs
 *   - recentSessions list
 *   - policies in effect
 *   - ragEnabled / knowledgeReady
 *
 * Also accepts an optional ?locale=zh|en query param for i18n labels.
 */
import { getSystemSnapshot } from "@ai-site/ai/src/agent-os/session-store";
import { countKnowledgeChunks, isPgvectorEnabled, getRuntimeObservabilitySnapshot } from "@ai-site/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rateLimited = checkRateLimit(request, "agent-sessions", { windowMs: 60_000, maxRequests: 20 });
  if (rateLimited) return rateLimited;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "zh";

  // Pull observability telemetry to enrich daily counters
  const [observability, knowledgeCount] = await Promise.all([
    getRuntimeObservabilitySnapshot().catch(() => null),
    countKnowledgeChunks().catch(() => 0),
  ]);

  const snapshot = getSystemSnapshot({
    knowledgeChunks: knowledgeCount,
    pgvectorEnabled: isPgvectorEnabled(),
  });

  // Merge observability data for richer run/tool-call counts
  if (observability) {
    const obs = observability as {
      counts?: {
        llmRuns?: number;
        toolCalls?: number;
        uiActions?: number;
        sessions?: number;
      };
    };
    const counts = obs.counts ?? {};
    // Prefer live store counters but fall back to persisted observability when store is cold
    if (snapshot.runsToday === 0 && counts.llmRuns) {
      snapshot.runsToday = counts.llmRuns;
    }
    if (snapshot.toolCallsToday === 0 && counts.toolCalls) {
      snapshot.toolCallsToday = counts.toolCalls;
    }
  }

  return NextResponse.json({
    locale,
    snapshot,
    status: "ok",
  });
}
