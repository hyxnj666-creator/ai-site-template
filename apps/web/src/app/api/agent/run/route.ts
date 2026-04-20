import { agentStreamRequestSchema, chatModelOptions } from "@ai-site/ai";
import { createSession, startRun, completeRun } from "@ai-site/ai/src/agent-os/session-store";
import { NextResponse } from "next/server";
import { runAgentStream } from "@/lib/ai-runtime/agent-streaming";
import { recordAgentRuntime } from "@/lib/observability/runtime-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizePromptInput } from "@/lib/input-sanitize";

export async function GET() {
  return NextResponse.json({
    agent: "AI Assistant",
    models: chatModelOptions,
    status: "ready",
    transport: "ndjson",
  });
}

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, "agent", { windowMs: 60_000, maxRequests: 8 });
  if (rateLimited) return rateLimited;

  const payload = await request.json().catch(() => null);
  const parsed = agentStreamRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sanitizedData = { ...parsed.data, prompt: sanitizePromptInput(parsed.data.prompt) };

  // Track session in Agent OS session store
  const visitorId = request.headers.get("x-visitor-id") ?? "anonymous";
  const locale = (sanitizedData.locale ?? "zh") as "zh" | "en";
  const session = createSession({ locale, surface: "agent", visitorId });
  const run = startRun({
    locale,
    model: sanitizedData.model ?? "gpt-5.4",
    prompt: sanitizedData.prompt,
    sessionId: session.id,
    surface: "agent",
  });

  const runStartMs = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      await runAgentStream(sanitizedData, controller);
    },
  });

  const decoder = new TextDecoder();
  let lineBuffer = "";
  const { readable, writable } = new TransformStream({
    transform(chunk, transformController) {
      transformController.enqueue(chunk);

      try {
        lineBuffer += decoder.decode(chunk, { stream: true });
        const parts = lineBuffer.split("\n");
        lineBuffer = parts.pop() || "";
        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed) as { type: string; [key: string]: unknown };
            if (event.type === "done") {
              const latencyMs = (event.latencyMs as number) ?? (Date.now() - runStartMs);
              void recordAgentRuntime({
                latencyMs,
                model: (event.model as string) ?? (event.provider as string) ?? "unknown",
                route: "/api/agent/run",
                summary: (event.summary as string) ?? "",
                toolCalls: Array.isArray(event.toolCalls)
                  ? (event.toolCalls as Array<{ name: string; detail: string; status: "completed" | "pending" }>)
                  : [],
              });
              // Update Agent OS session store
              if (run) {
                completeRun({
                  durationMs: latencyMs,
                  response: (event.summary as string) ?? "",
                  runId: run.id,
                  sessionId: session.id,
                });
              }
            }
          } catch { /* single line parse failure — skip */ }
        }
      } catch {
        // decoding errors are non-critical for the stream
      }
    },
  });

  void stream.pipeTo(writable);

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
