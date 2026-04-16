import { siteAgent, personaPrompt, safetyRules, type ChatModelId } from "@ai-site/ai";
import { getHomeContent, getPersonalProfile, type SiteLocale } from "@ai-site/content";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, type LanguageModel } from "ai";
import type { KnowledgeHit } from "@/lib/chat/knowledge";

export interface ProjectAwareTextResult {
  latencyMs: number;
  mode: "fallback" | "live";
  provider: string;
  text: string;
  usedModel: string;
}

export function compactText(value: string, max = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 3).trim()}...`;
}

export function compactPrompt(value: string, max = 96) {
  return compactText(value, max);
}

export function toChatSources(hits: KnowledgeHit[], limit = 4) {
  return hits.slice(0, limit).map((hit) => ({
    path: hit.path,
    title: hit.title,
  }));
}

export function splitIntoParagraphs(value: string, maxParagraphs = 3) {
  const blockParagraphs = value
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (blockParagraphs.length > 0) {
    return blockParagraphs.slice(0, maxParagraphs).map((chunk) => compactText(chunk, 280));
  }

  const sentenceParagraphs = value
    .split(/(?<=[。！？.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (sentenceParagraphs.length > 0) {
    const grouped: string[] = [];

    for (let index = 0; index < sentenceParagraphs.length; index += 2) {
      grouped.push(sentenceParagraphs.slice(index, index + 2).join(" "));
    }

    return grouped.slice(0, maxParagraphs).map((chunk) => compactText(chunk, 280));
  }

  return [compactText(value, 280)];
}

export function summarizeKnowledgeHits(locale: SiteLocale, hits: KnowledgeHit[], limit = 3) {
  if (hits.length === 0) {
    return locale === "zh"
      ? "当前没有命中额外知识片段，先按站点已有骨架与默认上下文继续执行。"
      : "No extra knowledge chunks were retrieved, so the runtime is proceeding with the existing site context.";
  }

  return hits
    .slice(0, limit)
    .map((hit, index) =>
      locale === "zh"
        ? `${index + 1}. ${hit.title} -> ${compactText(hit.snippet, 120)}`
        : `${index + 1}. ${hit.title} -> ${compactText(hit.snippet, 120)}`,
    )
    .join("\n");
}

function resolveOpenAIModel(model: ChatModelId) {
  if (model === "gpt-5-mini") {
    return process.env.OPENAI_FAST_CHAT_MODEL || "gpt-5-mini";
  }

  return process.env.OPENAI_CHAT_MODEL || "gpt-5";
}

function resolveAnthropicModel() {
  return process.env.ANTHROPIC_CHAT_MODEL || "claude-sonnet-4-20250514";
}

export function createModelInstance(model: ChatModelId): LanguageModel | null {
  if (model === "claude-sonnet") {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(resolveAnthropicModel());
  }

  if (!process.env.OPENAI_API_KEY) return null;
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  return openai(resolveOpenAIModel(model));
}

export { streamText, generateText };

export function buildProjectAwareSystemPrompt(args: {
  knowledgeHits: KnowledgeHit[];
  locale: SiteLocale;
  styleInstruction: string;
  taskLabel: string;
}) {
  const profile = getPersonalProfile(args.locale);
  const homeContent = getHomeContent(args.locale);
  const localeInstruction =
    args.locale === "zh"
      ? "默认使用简体中文回答，除非用户明确要求英文。语气要冷静、准确、克制，但不能机械。"
      : "Default to English unless the user clearly asks for Chinese. Keep the tone calm, precise, concise, and grounded.";
  const knowledgeSummary =
    args.knowledgeHits.length > 0
      ? args.knowledgeHits
          .map(
            (hit, index) =>
              `[${index + 1}] ${hit.title} (${hit.path})\n${compactText(hit.snippet, 220)}`,
          )
          .join("\n\n")
      : args.locale === "zh"
        ? "No retrieved knowledge hits. Fall back to the known site architecture and current Phase 1 status."
        : "No retrieved knowledge hits. Fall back to the known site architecture and current Phase 1 status.";

  return [
    personaPrompt,
    localeInstruction,
    `You are the live AI runtime for ${siteAgent.name}.`,
    `Task: ${args.taskLabel}`,
    `Profile: ${profile.name} / ${profile.title}. ${profile.summary}`,
    `Homepage direction: ${homeContent.hero.title}. ${homeContent.hero.description}`,
    "Retrieved knowledge context:",
    knowledgeSummary,
    "Execution rules:",
    "- Stay grounded in the retrieved and known project context.",
    "- Do not invent implementations that do not exist.",
    "- Prefer dense, implementation-oriented answers over generic advice.",
    `- Style instruction: ${args.styleInstruction}`,
    safetyRules,
  ].join("\n\n");
}

export async function generateProjectAwareText(args: {
  fallbackText: string;
  knowledgeHits: KnowledgeHit[];
  locale: SiteLocale;
  model: ChatModelId;
  prompt: string;
  styleInstruction: string;
  taskLabel: string;
}): Promise<ProjectAwareTextResult> {
  const resolvedModel = resolveOpenAIModel(args.model);

  if (!process.env.OPENAI_API_KEY) {
    return {
      latencyMs: 0,
      mode: "fallback",
      provider: "local:fallback",
      text: args.fallbackText,
      usedModel: resolvedModel,
    };
  }

  const startedAt = Date.now();
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  try {
    const result = await generateText({
      model: openai(resolvedModel),
      prompt: args.prompt,
      system: buildProjectAwareSystemPrompt({
        knowledgeHits: args.knowledgeHits,
        locale: args.locale,
        styleInstruction: args.styleInstruction,
        taskLabel: args.taskLabel,
      }),
    });

    return {
      latencyMs: Date.now() - startedAt,
      mode: "live",
      provider: `openai:${resolvedModel}`,
      text: result.text.trim() || args.fallbackText,
      usedModel: resolvedModel,
    };
  } catch (error) {
    console.error(error);

    return {
      latencyMs: Date.now() - startedAt,
      mode: "fallback",
      provider: "local:fallback",
      text: args.fallbackText,
      usedModel: resolvedModel,
    };
  }
}
