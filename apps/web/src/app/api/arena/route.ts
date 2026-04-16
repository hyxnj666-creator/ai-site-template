import { arenaRunRequestSchema, arenaModelLabels } from "@ai-site/ai";
import { NextResponse } from "next/server";
import { streamArenaComparison } from "@/lib/ai-runtime/arena-runtime";
import { recordArenaRuntime } from "@/lib/observability/runtime-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizePromptInput } from "@/lib/input-sanitize";

export async function GET() {
  return NextResponse.json({
    models: Object.entries(arenaModelLabels).map(([id, label]) => ({ id, label })),
    status: "ready",
  });
}

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, "arena", { windowMs: 60_000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  const requestStartedAt = Date.now();
  const payload = await request.json().catch(() => null);
  const parsed = arenaRunRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sanitizedData = { ...parsed.data, prompt: sanitizePromptInput(parsed.data.prompt) };
  const stream = streamArenaComparison(sanitizedData);

  void recordArenaRuntime({
    latencyMs: Date.now() - requestStartedAt,
    model: `${sanitizedData.leftModel} vs ${sanitizedData.rightModel}`,
    route: "/ai/arena",
    summary: `Arena: ${sanitizedData.prompt.slice(0, 100)}`,
    toolCalls: [],
  }).catch(() => {});

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
