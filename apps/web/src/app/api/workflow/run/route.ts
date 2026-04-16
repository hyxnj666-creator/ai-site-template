import {
  workflowRegistry,
  workflowRunRequestSchema,
  workflowStudioRunRequestSchema,
} from "@ai-site/ai";
import { NextResponse } from "next/server";
import { runWorkflowRuntime } from "@/lib/ai-runtime/workflow-runtime";
import { runWorkflowStudio } from "@/lib/ai-runtime/workflow-studio-runtime";
import { recordWorkflowRuntime } from "@/lib/observability/runtime-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizePromptInput } from "@/lib/input-sanitize";

export async function GET() {
  return NextResponse.json({
    artifacts: ["executionReview", "knowledgeSignalRadar", "techRadar"],
    status: "ready",
    workflows: Object.values(workflowRegistry),
  });
}

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, "workflow", { windowMs: 60_000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  const requestStartedAt = Date.now();
  const payload = await request.json().catch(() => null);

  if (payload?.graph) {
    const parsed = workflowStudioRunRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const sanitizedData = {
      ...parsed.data,
      prompt: sanitizePromptInput(parsed.data.prompt),
    };

    const stream = runWorkflowStudio(sanitizedData);

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  }

  const parsed = workflowRunRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sanitizedData = { ...parsed.data, prompt: sanitizePromptInput(parsed.data.prompt) };
  const workflowResponse = await runWorkflowRuntime(sanitizedData);
  const latencyMs = Math.max(workflowResponse.log.latencyMs, Date.now() - requestStartedAt);

  await recordWorkflowRuntime({
    latencyMs,
    model: parsed.data.model,
    route: "/ai/workflow",
    summary: workflowResponse.output.summary,
    toolCalls: workflowResponse.toolCalls,
  });

  return NextResponse.json({
    ...workflowResponse,
    log: { ...workflowResponse.log, latencyMs },
  });
}
