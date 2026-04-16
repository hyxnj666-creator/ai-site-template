import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { checkRateLimit } from "@/lib/rate-limit";

export interface IntentResult {
  intent: "navigate" | "ask" | "demo" | "open";
  confidence: number;
  route?: string;
  label: string;
  description: string;
}

const ROUTES = [
  { route: "/", label: "首页", keywords: "home homepage 首页 主页" },
  { route: "/about", label: "关于我", keywords: "about me 关于 介绍 简历" },
  { route: "/evolution", label: "技术进化", keywords: "evolution 进化 成长 技术栈 timeline" },
  { route: "/terminal", label: "交互终端", keywords: "terminal 终端 bash shell" },
  { route: "/ai/chat", label: "AI 对话", keywords: "chat 对话 聊天 问" },
  { route: "/ai/workflow", label: "Workflow Studio", keywords: "workflow 工作流 studio flow" },
  { route: "/ai/arena", label: "模型竞技场", keywords: "arena 竞技场 model compare 对比 比较" },
  { route: "/ai/knowledge", label: "知识库", keywords: "knowledge 知识库 RAG 检索" },
  { route: "/ai/agent", label: "Agent 控制台", keywords: "agent 智能体 mission control" },
  { route: "/ai/os", label: "Agent OS 控制台", keywords: "agent os console 控制台 sessions 会话 traces 追踪 runtime" },
  { route: "/ai/mcp", label: "MCP 演示", keywords: "mcp tools 工具 function" },
  { route: "/lab", label: "实验室", keywords: "lab 实验 experiment project 项目" },
];

const SYSTEM_PROMPT = `You are an intent classifier for a personal developer website's command palette.

Available pages:
${ROUTES.map((r) => `${r.route}: ${r.label} (keywords: ${r.keywords})`).join("\n")}

Respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{"intent":"navigate"|"ask"|"demo"|"open","confidence":0.0-1.0,"route":"string or null","label":"short action label in Chinese","description":"one sentence in Chinese describing what will happen"}

Rules:
- "navigate": user wants to go to a page (confidence >= 0.7 when route is clear)
- "ask": user has a question → route should be /ai/chat
- "demo": user wants to see a feature demo
- "open": external link (no route)
- If unsure, use "ask" with confidence 0.5`;

export async function POST(req: Request) {
  // 30 req/min per IP — generous enough for fast typing, blocks abuse
  const limited = checkRateLimit(req, "intent", { windowMs: 60_000, maxRequests: 30 });
  if (limited) return limited;

  let locale = "zh";
  try {
    const body = (await req.json()) as { query: string; locale?: string };
    locale = body.locale ?? "zh";
    const { query } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const { text } = await generateText({
      model: openai(process.env.OPENAI_FAST_CHAT_MODEL ?? "gpt-4o-mini"),
      system: SYSTEM_PROMPT + (locale === "en" ? "\nUse English for label and description." : ""),
      prompt: query.trim().slice(0, 200),
      maxOutputTokens: 120,
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]) as IntentResult;

    // Validate and sanitize
    const validIntents = ["navigate", "ask", "demo", "open"];
    if (!validIntents.includes(result.intent)) result.intent = "ask";
    if (typeof result.confidence !== "number") result.confidence = 0.5;
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    // Whitelist route: only allow known internal paths to prevent open-redirect
    const allowedRoutes = new Set(ROUTES.map((r) => r.route));
    if (result.route && !allowedRoutes.has(result.route)) {
      result.route = "/ai/chat";
      result.intent = "ask";
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[intent]", error);
    const isEn = locale === "en";
    const fallback: IntentResult = {
      intent: "ask",
      confidence: 0.5,
      label: isEn ? "AI Chat" : "AI 对话",
      description: isEn ? "Ask the AI assistant" : "询问 AI 助手",
      route: "/ai/chat",
    };
    return NextResponse.json(fallback);
  }
}
