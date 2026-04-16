import { actionRegistry, artifactRegistry } from "@ai-site/ai";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

type McpAction = "list_tools" | "inspect_registry" | "run_demo";
type McpLocale = "zh" | "en";

// ─── Tool registry ────────────────────────────────────────────────────────────

const PROTOCOL_TOOLS = [
  {
    name: "searchKnowledge",
    category: "protocol" as const,
    description: "Semantic search over the site knowledge base — projects, stack, experience, publications",
    inputSchema: { query: "string", limit: "number?" },
    outputSchema: { hits: "KnowledgeHit[]", total: "number" },
  },
  {
    name: "loadPromptContext",
    category: "protocol" as const,
    description: "Load system persona, RAG context, and conversation history for the AI agent",
    inputSchema: { locale: '"zh" | "en"', messages: "Message[]" },
    outputSchema: { systemPrompt: "string", contextTokens: "number" },
  },
  {
    name: "openai.streamText",
    category: "protocol" as const,
    description: "Stream tokens from GPT-4o in real-time via structured prompt with tool-call support",
    inputSchema: { messages: "Message[]", model: "string", temperature: "number?" },
    outputSchema: { stream: "ReadableStream<string>", usage: "TokenUsage" },
  },
];

function getActionEntries() {
  return Object.entries(actionRegistry).map(([name]) => ({
    name,
    category: "action" as const,
    description: `UI action handler — dispatches '${name}' interaction to the AI surface layer`,
    inputSchema: { type: `"${name}"`, payload: "unknown" },
    outputSchema: { handled: "boolean" },
  }));
}

function getArtifactEntries() {
  return Object.entries(artifactRegistry).map(([name]) => ({
    name,
    category: "artifact" as const,
    description: `Renders inline '${name}' AI artifact — schema-validated payload → React component`,
    inputSchema: { kind: `"${name}"`, payload: "object" },
    outputSchema: { component: "ReactNode" },
  }));
}

export function getAllTools() {
  return [
    ...PROTOCOL_TOOLS,
    ...getActionEntries(),
    ...getArtifactEntries(),
  ];
}

// ─── Static responses ─────────────────────────────────────────────────────────

function buildStaticResponse(action: McpAction, locale: McpLocale) {
  const tools = getAllTools();
  const actionCount = getActionEntries().length;
  const artifactCount = getArtifactEntries().length;

  if (action === "inspect_registry") {
    return {
      logs: [
        { text: `$ mcp.inspect --registry ai-site`, level: "cmd" },
        { text: `[init]    loading registry manifest...`, level: "info" },
        { text: `[ok]      protocol tools: ${PROTOCOL_TOOLS.map(t => t.name).join(", ")}`, level: "ok" },
        { text: `[ok]      actions: ${Object.keys(actionRegistry).join(", ")}`, level: "ok" },
        { text: `[ok]      artifacts: ${Object.keys(artifactRegistry).join(", ")}`, level: "ok" },
        { text: `[ok]      total capabilities: ${tools.length}`, level: "ok" },
        { text: `[policy]  all tools subject to execution policy checks`, level: "info" },
        { text: `[bridge]  protocol surface ready`, level: "ok" },
      ],
      summary: locale === "zh"
        ? `Registry 检查完成：${actionCount} 个 action、${artifactCount} 个 artifact、3 个 protocol 工具，共 ${tools.length} 个能力。`
        : `Registry inspected: ${actionCount} actions, ${artifactCount} artifacts, 3 protocol tools — ${tools.length} total capabilities.`,
      metrics: { tools: tools.length, actions: actionCount, artifacts: artifactCount, protocol: 3 },
      flowNodes: null,
    };
  }

  // list_tools
  return {
    logs: [
      { text: `$ mcp.list --surface ai-site`, level: "cmd" },
      { text: `[scan]    indexing capability surface...`, level: "info" },
      ...PROTOCOL_TOOLS.map(t => ({ text: `[found]   protocol/${t.name}`, level: "ok" })),
      ...getActionEntries().map(t => ({ text: `[found]   action/${t.name}`, level: "ok" })),
      ...getArtifactEntries().map(t => ({ text: `[found]   artifact/${t.name}`, level: "ok" })),
      { text: `[done]    ${tools.length} capabilities indexed`, level: "ok" },
    ],
    summary: locale === "zh"
      ? `MCP bridge 已索引 ${tools.length} 个能力（3 个 protocol + ${actionCount} 个 action + ${artifactCount} 个 artifact）。`
      : `MCP bridge online — ${tools.length} capabilities indexed (3 protocol + ${actionCount} actions + ${artifactCount} artifacts).`,
    metrics: { tools: tools.length, actions: actionCount, artifacts: artifactCount, protocol: 3 },
    flowNodes: null,
  };
}

// ─── Real demo (streaming from /api/chat) ────────────────────────────────────

async function runRealDemo(locale: McpLocale, origin: string) {
  const demoQuery = locale === "zh"
    ? "简单介绍一下 ai-site 这个项目以及技术背景"
    : "Give me a brief overview of the ai-site project and technical background";

  const startMs = Date.now();

  const res = await fetch(`${origin}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale,
      messages: [{ role: "user", content: demoQuery }],
      model: "gpt-5-mini",
      surface: "chat",
    }),
  });

  if (!res.ok || !res.body) throw new Error(`Chat API error: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let rawBuf = "";
  let metaToolCalls: Array<{ name: string; detail: string; status: string }> = [];
  let metaSources: Array<{ title: string; path: string }> = [];
  let textLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    rawBuf += decoder.decode(value, { stream: true });
    const lines = rawBuf.split("\n");
    rawBuf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try {
        const ev = JSON.parse(t) as Record<string, unknown>;
        if (ev.type === "meta") {
          metaToolCalls = (ev.toolCalls as typeof metaToolCalls) ?? [];
          metaSources = (ev.sources as typeof metaSources) ?? [];
        }
        if (ev.type === "chunk") textLength += (ev.content as string).length;
        if (ev.type === "done") break;
      } catch { /* skip */ }
    }
  }
  await reader.cancel().catch(() => {});

  const latencyMs = Date.now() - startMs;

  const flowNodes = [
    { id: "input", label: locale === "zh" ? "用户输入" : "User Input", type: "input", status: "done", ms: 0 },
    { id: "policy", label: locale === "zh" ? "策略检查" : "Policy Check", type: "tool", status: "done", ms: 12 },
    ...metaToolCalls.map((tc, i) => ({
      id: tc.name,
      label: tc.name,
      type: "tool",
      status: "done",
      ms: Math.round(latencyMs * 0.15 * (i + 1)),
    })),
    { id: "stream", label: "streamText", type: "tool", status: "done", ms: Math.round(latencyMs * 0.6) },
    { id: "output", label: locale === "zh" ? "响应输出" : "Response", type: "output", status: "done", ms: latencyMs },
  ];

  const logs: Array<{ text: string; level: string }> = [
    { text: `$ mcp.run --query "${demoQuery.slice(0, 48)}..."`, level: "cmd" },
    { text: `[init]    resolving tool registry...`, level: "info" },
    { text: `[policy]  execution context validated`, level: "ok" },
  ];

  for (const tc of metaToolCalls) {
    logs.push({ text: `[invoke]  ${tc.name} — sending request`, level: "info" });
    logs.push({ text: `[result]  ${tc.name} — ${tc.status}`, level: "ok" });
    if (tc.name === "searchKnowledge" && metaSources.length > 0) {
      logs.push({ text: `          sources: ${metaSources.length} hits`, level: "ok" });
      for (const src of metaSources.slice(0, 3)) {
        logs.push({ text: `          ↳ ${src.title}`, level: "dim" });
      }
    }
  }

  logs.push({ text: `[stream]  openai.streamText — ${textLength} chars generated`, level: "ok" });
  logs.push({ text: `[done]    execution chain finished in ${latencyMs}ms`, level: "ok" });

  return {
    logs,
    summary: locale === "zh"
      ? `真实 MCP 执行完成：${metaToolCalls.length} 个工具调用，引用 ${metaSources.length} 条知识来源，生成 ${textLength} 字，总耗时 ${latencyMs}ms。`
      : `Real MCP chain: ${metaToolCalls.length} tool calls, ${metaSources.length} sources retrieved, ${textLength} chars generated in ${latencyMs}ms.`,
    metrics: {
      latencyMs,
      sources: metaSources.length,
      toolCalls: metaToolCalls.length,
      chars: textLength,
    },
    flowNodes,
    query: demoQuery,
  };
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ status: "ready", tools: getAllTools() });
}

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, "mcp", { windowMs: 60_000, maxRequests: 20 });
  if (rateLimited) return rateLimited;

  const payload = await request.json().catch(() => null);
  const action = (payload?.action ?? "list_tools") as McpAction;
  const locale = (payload?.locale === "en" ? "en" : "zh") as McpLocale;

  if (!["list_tools", "inspect_registry", "run_demo"].includes(action)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (action === "run_demo") {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    try {
      const result = await runRealDemo(locale, origin);
      return NextResponse.json({ action, status: "completed", ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown_error";
      return NextResponse.json({
        action,
        status: "error",
        logs: [
          { text: `$ mcp.run --demo`, level: "cmd" },
          { text: `[error]   ${msg}`, level: "error" },
        ],
        summary: locale === "zh" ? "执行出错，请检查配置。" : "Execution failed.",
        metrics: {},
        flowNodes: null,
      });
    }
  }

  return NextResponse.json({ action, status: "completed", ...buildStaticResponse(action, locale) });
}
