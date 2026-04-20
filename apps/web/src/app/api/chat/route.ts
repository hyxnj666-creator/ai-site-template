import {
  chatModelOptions,
  chatRequestSchema,
  type ChatModelId,
  siteAgent,
  personaPrompt,
  safetyRules,
  buildChatArtifacts,
  createArtifact,
} from "@ai-site/ai";
import { createSession, startRun, completeRun } from "@ai-site/ai/src/agent-os/session-store";
import { getHomeContent, getPersonalProfile, timeline, projects } from "@ai-site/content";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { retrieveKnowledge } from "@/lib/chat/knowledge";
import { recordChatRuntime } from "@/lib/observability/runtime-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeMessageContent, extractTextContent, filterClientMessages } from "@/lib/input-sanitize";

function resolveOpenAIModel(model: ChatModelId) {
  if (model === "gpt-5-mini") {
    return process.env.OPENAI_FAST_CHAT_MODEL || "gpt-5.4-mini";
  }
  return process.env.OPENAI_CHAT_MODEL || "gpt-5.4";
}

function buildSystemPrompt(
  locale: "zh" | "en",
  knowledgeHits: Array<{ path: string; snippet: string; title: string }>,
) {
  const profile = getPersonalProfile(locale);
  const homeContent = getHomeContent(locale);

  const localeInstruction =
    locale === "zh"
      ? "默认使用简体中文回答，除非用户明确要求英文。语气要冷静、准确、克制，但不能机械。"
      : "Default to English unless the user clearly asks for Chinese. Keep the tone calm, precise, concise, and design-aware.";

  const knowledgeSummary = knowledgeHits
    .map((hit, index) => `[${index + 1}] ${hit.title} (${hit.path})\n${hit.snippet}`)
    .join("\n\n");

  return [
    personaPrompt,
    localeInstruction,
    `You are the live AI persona for ${siteAgent.name}.`,
    `Profile: ${profile.name} / ${profile.title}. ${profile.summary}`,
    `Homepage direction: ${homeContent.hero.title}. ${homeContent.hero.description}`,
    "Retrieved knowledge context:",
    knowledgeSummary,
    "Important behavior rules:",
    "- Be specific and grounded in the actual project context above.",
    "- If something is not implemented yet, say so clearly instead of pretending it exists.",
    "- Prefer concise but information-dense answers.",
    "- Use Markdown formatting: headings, lists, code blocks, bold, etc. for structured answers.",
    "- When relevant, mention the current site status: homepage, i18n, typography, command palette, and /ai/chat shell are implemented.",
    "Tool usage guidelines:",
    "- You have tools to control the website: navigate pages, switch themes, show skills/projects.",
    "- Use tools proactively when they enhance the answer. For example, if someone asks about your React projects, call showProjects.",
    "- If someone says '切成亮色模式' or 'switch to light mode', call toggleTheme.",
    "- If someone says '给我看你的项目' or 'show me your projects', call showProjects.",
    "- If someone asks '你的技术栈' or 'what's your tech stack', call showSkills.",
    "- If someone wants to see a specific feature page, call navigateTo.",
    "- Always provide a text response alongside tool calls to explain what you did.",
    "- Do NOT call tools when the user is just having a general conversation.",
    safetyRules,
  ].join("\n\n");
}

const CAREER_KEYWORDS_ZH = ["经历", "工作", "项目", "履历", "经验", "做过", "背景", "技术栈", "简历", "时间线", "成长", "学习"];
const CAREER_KEYWORDS_EN = ["experience", "work", "project", "career", "background", "resume", "cv", "timeline", "skills", "tech stack", "built", "history"];

const ALLOWED_ROUTES: Record<string, { zh: string; en: string }> = {
  "/": { zh: "首页", en: "Home" },
  "/about": { zh: "关于", en: "About" },
  "/evolution": { zh: "进化日志", en: "Evolution Log" },
  "/ai": { zh: "AI Nexus", en: "AI Nexus" },
  "/ai/chat": { zh: "AI 对话", en: "AI Chat" },
  "/ai/agent": { zh: "Agent 任务控制台", en: "Agent Mission Control" },
  "/ai/workflow": { zh: "工作流编辑器", en: "Workflow Studio" },
  "/ai/arena": { zh: "模型竞技场", en: "Model Arena" },
  "/ai/knowledge": { zh: "知识库", en: "Knowledge Base" },
  "/ai/mcp": { zh: "MCP 接口", en: "MCP Interface" },
  "/ai/os": { zh: "Agent OS 控制台", en: "Agent OS Console" },
  "/lab": { zh: "实验室", en: "Experiment Lab" },
  "/terminal": { zh: "终端", en: "Terminal" },
};

const TECH_SKILLS = [
  { name: "TypeScript", level: 95, category: "Frontend" },
  { name: "React", level: 92, category: "Frontend" },
  { name: "Next.js", level: 90, category: "Frontend" },
  { name: "CSS / Tailwind", level: 88, category: "Frontend" },
  { name: "Node.js", level: 85, category: "Backend" },
  { name: "Python", level: 78, category: "Backend" },
  { name: "PostgreSQL", level: 72, category: "Backend" },
  { name: "Redis", level: 65, category: "Backend" },
  { name: "LLM / OpenAI", level: 90, category: "AI/ML" },
  { name: "RAG / Embeddings", level: 82, category: "AI/ML" },
  { name: "AI Agents", level: 78, category: "AI/ML" },
  { name: "MCP / Tool Use", level: 75, category: "AI/ML" },
  { name: "Docker", level: 70, category: "Infra" },
  { name: "Nginx / PM2", level: 68, category: "Infra" },
  { name: "Git / CI", level: 88, category: "Infra" },
];

function buildUiTools(locale: "zh" | "en") {
  return {
    navigateTo: tool({
      description: locale === "zh"
        ? "导航到本站的某个页面。当用户想要查看某个功能或页面时调用。"
        : "Navigate to a page on this site. Call when the user wants to see a feature or page.",
      inputSchema: z.object({
        route: z.enum(Object.keys(ALLOWED_ROUTES) as [string, ...string[]]).describe("Target route path"),
        reason: z.string().describe("Brief reason for navigation"),
      }),
      execute: async ({ route, reason }) => {
        const label = ALLOWED_ROUTES[route]?.[locale] ?? route;
        return { route, label, reason };
      },
    }),
    toggleTheme: tool({
      description: locale === "zh"
        ? "切换网站主题（亮色/暗色/跟随系统）。当用户要求切换主题时调用。"
        : "Toggle the site theme (light/dark/system). Call when the user asks to change theme.",
      inputSchema: z.object({
        theme: z.enum(["light", "dark", "system"]).describe("Target theme"),
      }),
      execute: async ({ theme }) => {
        const labels: Record<string, Record<string, string>> = {
          light: { zh: "亮色模式", en: "Light Mode" },
          dark: { zh: "暗色模式", en: "Dark Mode" },
          system: { zh: "跟随系统", en: "System Default" },
        };
        return { theme, label: labels[theme][locale] };
      },
    }),
    showSkills: tool({
      description: locale === "zh"
        ? "展示技术栈和技能等级。当用户询问技术能力、技术栈、擅长什么时调用。可按类别筛选。"
        : "Show the tech stack and skill levels. Call when asked about technical abilities. Can filter by category.",
      inputSchema: z.object({
        category: z.enum(["All", "Frontend", "Backend", "AI/ML", "Infra"]).optional()
          .describe("Filter by category, or omit for all"),
      }),
      execute: async ({ category }) => {
        const filtered = category && category !== "All"
          ? TECH_SKILLS.filter((s) => s.category === category)
          : TECH_SKILLS;
        return { category: category ?? "All", skills: filtered };
      },
    }),
    showProjects: tool({
      description: locale === "zh"
        ? "展示项目列表。当用户询问做过哪些项目时调用。"
        : "Show the project list. Call when the user asks about projects.",
      inputSchema: z.object({
        filter: z.string().optional().describe("Optional tech/keyword filter"),
      }),
      execute: async ({ filter }) => {
        const siteProjects = [
          {
            title: "AI Site",
            summary: locale === "zh"
              ? "AI 原生个人平台 — 融合 Agent、RAG、Workflow、MCP 的沉浸式交互体验"
              : "AI-native personal platform — immersive experience with Agent, RAG, Workflow, MCP",
            tags: ["Next.js 16", "AI SDK", "React Flow", "pgvector"],
            href: "/",
          },
          {
            title: "AI Review Pipeline",
            summary: locale === "zh"
              ? "AI 驱动的代码审查流水线 — GitHub Action + LLM 自动化审查"
              : "AI-powered code review pipeline — GitHub Action + LLM automated review",
            tags: ["Node.js", "OpenAI", "GitHub Actions"],
          },
          {
            title: "AI Git Msg",
            summary: locale === "zh"
              ? "AI 生成 Git commit message 的 CLI 工具"
              : "CLI tool for AI-generated Git commit messages",
            tags: ["CLI", "OpenAI", "Git"],
          },
          {
            title: "AI i18n Sync",
            summary: locale === "zh"
              ? "AI 驱动的国际化翻译同步工具"
              : "AI-powered i18n translation sync tool",
            tags: ["CLI", "OpenAI", "i18n"],
          },
        ];
        const filtered = filter
          ? siteProjects.filter((p) =>
              p.title.toLowerCase().includes(filter.toLowerCase()) ||
              p.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())))
          : siteProjects;
        return { projects: filtered, filter: filter ?? null };
      },
    }),
  };
}

function isCareerQuery(query: string, locale: "zh" | "en"): boolean {
  const q = query.toLowerCase();
  const keywords = locale === "zh" ? CAREER_KEYWORDS_ZH : CAREER_KEYWORDS_EN;
  return keywords.some((kw) => q.includes(kw));
}

function buildProjectTimeline(
  locale: "zh" | "en",
  knowledgeHits: Array<{ path: string; score: number; snippet: string; title: string }>,
) {
  // Use knowledge hits as timeline items (most relevant first)
  const hitItems = knowledgeHits.slice(0, 5).map((hit) => ({
    description: hit.snippet.slice(0, 160).trim() + (hit.snippet.length > 160 ? "..." : ""),
    source: hit.path,
    tags: [hit.path.includes("github") ? "GitHub" : hit.path.includes("blog") ? "Blog" : "Docs"],
    title: hit.title,
    year: new Date().getFullYear().toString(),
  }));

  // Supplement with static content timeline items
  const staticItems = [
    ...timeline.map((item) => ({
      description: item.description,
      title: item.title,
      year: item.year,
    })),
    ...projects.slice(0, 3).map((p) => ({
      description: p.summary,
      tags: p.tags,
      title: p.title,
      year: new Date().getFullYear().toString(),
    })),
  ];

  // Prefer knowledge hits, fallback to static
  const items = hitItems.length > 0 ? hitItems : staticItems;

  return items.length > 0
    ? items
    : [
        {
          description: locale === "zh" ? "AI 驱动的个人平台，展示全栈 AI 工程能力。" : "AI-native personal platform showcasing full-stack AI engineering.",
          tags: ["Next.js", "AI SDK", "React Flow"],
          title: locale === "zh" ? "AI-Native 个人平台" : "AI-Native Personal Platform",
          year: "2026",
        },
      ];
}

export async function GET() {
  return NextResponse.json({
    agent: "AI Assistant",
    mode: "live",
    models: chatModelOptions,
    status: "ready",
    transport: "ndjson",
  });
}

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, "chat", { windowMs: 60_000, maxRequests: 15 });
  if (rateLimited) return rateLimited;

  const requestStartedAt = Date.now();
  const payload = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "missing_openai_api_key",
        message: "OPENAI_API_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  const resolvedModel = resolveOpenAIModel(parsed.data.model);
  const latestUserContent =
    [...parsed.data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const latestUserMessage = extractTextContent(latestUserContent);
  const knowledgeHits = await retrieveKnowledge({
    locale: parsed.data.locale,
    query: latestUserMessage,
  });

  // Track session in Agent OS session store
  const visitorId = request.headers.get("x-visitor-id") ?? "anonymous";
  const agentSession = createSession({ locale: parsed.data.locale, surface: "chat", visitorId });
  const agentRun = startRun({
    locale: parsed.data.locale,
    model: resolvedModel,
    prompt: latestUserMessage,
    sessionId: agentSession.id,
    surface: "chat",
  });
  const chatRunStartMs = Date.now();

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      const toolCalls: Array<{ name: string; detail: string; status: "completed" | "pending" }> = [
        {
          name: "searchKnowledge",
          detail: parsed.data.locale === "zh"
            ? `检索到 ${knowledgeHits.length} 条相关知识片段`
            : `Retrieved ${knowledgeHits.length} relevant knowledge chunks`,
          status: "completed",
        },
        {
          name: "loadPromptContext",
          detail: parsed.data.locale === "zh"
            ? "将 persona、首页状态与检索上下文注入 prompt"
            : "Injected persona, homepage state, and retrieved context into prompt",
          status: "completed",
        },
        {
          name: `openai.streamText`,
          detail: parsed.data.locale === "zh"
            ? `通过 ${resolvedModel} 流式生成回答`
            : `Streaming response via ${resolvedModel}`,
          status: "completed",
        },
      ];

      const sources = knowledgeHits.length > 0
        ? knowledgeHits.map((hit) => ({ path: hit.path, title: hit.title }))
        : [];

      send({
        type: "meta",
        model: parsed.data.model,
        provider: `openai:${resolvedModel}`,
        mode: "live",
        sources,
        toolCalls,
      });

      try {
        const uiTools = buildUiTools(parsed.data.locale);
        const result = streamText({
          model: openai(resolvedModel),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: filterClientMessages(parsed.data.messages)
            .map((m) => ({ content: sanitizeMessageContent(m.content), role: m.role })) as any,
          system: buildSystemPrompt(parsed.data.locale, knowledgeHits),
          tools: uiTools,
          stopWhen: stepCountIs(2),
        });

        let fullText = "";
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            fullText += part.text;
            send({ type: "chunk", content: part.text });
          } else if (part.type === "tool-result") {
            send({
              type: "ui_action",
              tool: part.toolName,
              args: part.input,
              result: part.output,
            });
            toolCalls.push({
              name: part.toolName,
              detail: JSON.stringify(part.input),
              status: "completed" as const,
            });
          }
        }

        // Emit artifacts after stream completes
        const artifacts = buildChatArtifacts({
          model: parsed.data.model,
          sources,
          toolCalls,
        });
        for (const art of artifacts) {
          send({ type: "artifact", kind: art.kind, payload: art.payload });
        }

        // Conditional: project timeline when query is career-related
        if (isCareerQuery(latestUserMessage, parsed.data.locale)) {
          const timelineItems = buildProjectTimeline(parsed.data.locale, knowledgeHits);
          if (timelineItems.length > 0) {
            const timelineArt = createArtifact("projectTimeline", { items: timelineItems });
            send({ type: "artifact", kind: timelineArt.kind, payload: timelineArt.payload });
          }
        }

        const latencyMs = Date.now() - requestStartedAt;
        send({ type: "done", latencyMs });

        void recordChatRuntime({
          latencyMs,
          model: resolvedModel,
          route: parsed.data.surface === "palette" ? "/command-palette" : "/ai/chat",
          summary: fullText,
          surface: parsed.data.surface,
          toolCalls,
        });

        // Update Agent OS session store
        if (agentRun) {
          completeRun({
            durationMs: Date.now() - chatRunStartMs,
            response: fullText.slice(0, 200),
            runId: agentRun.id,
            sessionId: agentSession.id,
          });
        }

        // Increment live AI chat counter
        try {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
          void fetch(`${baseUrl}/api/visitors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "chat" }),
          });
        } catch { /* non-critical */ }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Stream failed";
        send({ type: "error", error: msg });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
