"use client";

import { type DemoChatResponse } from "@ai-site/ai";
import { type LocalizedValue, siteLinks } from "@ai-site/content";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef } from "react";
import { useLocalizedValue, useSiteLocale } from "./locale-provider";
import type { IntentResult } from "@/app/api/intent/route";

type PaletteGroupKey = "pages" | "ai" | "links";
type PaletteMode = "default" | "terminal";

interface PaletteItem {
  description: string;
  group: PaletteGroupKey;
  id: string;
  keywords: string[];
  label: string;
  type: "external" | "route";
  url: string;
}

interface CommandPaletteCopy {
  aiResponseLabel: string;
  aiSuggestionLabel: string;
  askAiLabel: string;
  artifactKindLabels: {
    executionReview: string;
    knowledgeSignalRadar: string;
    techRadar: string;
  };
  artifactsLabel: string;
  defaultModeLabel: string;
  dialogDescription: string;
  dialogTitle: string;
  emptyLabel: string;
  enterLabel: string;
  footerHint: string;
  fitLabel: string;
  groups: Record<PaletteGroupKey, string>;
  inputPlaceholder: string;
  items: PaletteItem[];
  latencyLabel: string;
  metricsLabel: string;
  navigatingLabel: string;
  runTerminalLabel: string;
  searchingLabel: string;
  selectLabel: string;
  sourcesLabel: string;
  stepsLabel: string;
  terminalEmptyLabel: string;
  terminalFooterHint: string;
  terminalModeLabel: string;
  terminalPlaceholder: string;
  terminalReadyLabel: string;
}

const commandPaletteCopyByLocale: LocalizedValue<CommandPaletteCopy> = {
  zh: {
    aiResponseLabel: "AI 响应",
    aiSuggestionLabel: "AI 推荐",
    askAiLabel: "与 AI 助手对话",
    artifactKindLabels: {
      executionReview: "执行审阅",
      knowledgeSignalRadar: "知识信号雷达",
      techRadar: "技术雷达",
    },
    artifactsLabel: "ARTIFACTS",
    defaultModeLabel: "标准模式",
    dialogDescription:
      "用于搜索页面、触发 AI 操作以及快速跳转到外部链接的全局命令面板。",
    dialogTitle: "全局 AI 命令面板",
    emptyLabel: "没有匹配结果。可以直接把问题带到 AI 对话页。",
    enterLabel: "回车",
    footerHint: "按 Ctrl / Cmd + K 随时唤起",
    fitLabel: "匹配",
    groups: {
      ai: "AI 操作",
      links: "外部链接",
      pages: "页面",
    },
    inputPlaceholder: "输入命令或问我任何问题...",
    items: [
      {
        description: "返回首页与能力总览",
        group: "pages",
        id: "page-home",
        keywords: ["首页", "home", "hero", "capabilities"],
        label: "首页",
        type: "route",
        url: "/",
      },
      {
        description: "进入 AI 中心主入口",
        group: "pages",
        id: "page-ai",
        keywords: ["ai", "playground", "chat", "agent"],
        label: "AI Playground",
        type: "route",
        url: "/ai",
      },
      {
        description: "查看 Agent 任务编排演示",
        group: "pages",
        id: "page-agent",
        keywords: ["agent", "智能体", "mission control"],
        label: "Agent Demo",
        type: "route",
        url: "/ai/agent",
      },
      {
        description: "查看 Workflow 编辑器",
        group: "pages",
        id: "page-workflow",
        keywords: ["workflow", "工作流", "flow"],
        label: "Workflow Editor",
        type: "route",
        url: "/ai/workflow",
      },
      {
        description: "查看站点进化日志",
        group: "pages",
        id: "page-evolution",
        keywords: ["evolution", "timeline", "进化"],
        label: "Evolution",
        type: "route",
        url: "/evolution",
      },
      {
        description: "打开 AI 对话页",
        group: "ai",
        id: "ai-chat",
        keywords: ["chat", "对话", "ask", "agent"],
        label: "和 AI 助手对话",
        type: "route",
        url: "/ai/chat",
      },
      {
        description: "打开模型竞技场对比 GPT 与 Claude",
        group: "ai",
        id: "ai-arena",
        keywords: ["arena", "gpt", "claude", "模型"],
        label: "对比 GPT vs Claude",
        type: "route",
        url: "/ai/arena",
      },
      {
        description: "打开知识库与语义检索入口",
        group: "ai",
        id: "ai-knowledge",
        keywords: ["knowledge", "rag", "search", "知识库"],
        label: "搜索知识库",
        type: "route",
        url: "/ai/knowledge",
      },
      {
        description: "查看独立简历站点",
        group: "links",
        id: "link-resume",
        keywords: ["resume", "简历", "profile"],
        label: "查看简历",
        type: "external",
        url: siteLinks.resume,
      },
      {
        description: "查看独立博客站点",
        group: "links",
        id: "link-blog",
        keywords: ["blog", "博客", "article"],
        label: "阅读博客",
        type: "external",
        url: siteLinks.blog,
      },
      {
        description: "打开 GitHub 主页",
        group: "links",
        id: "link-github",
        keywords: ["github", "source", "code"],
        label: "GitHub 主页",
        type: "external",
        url: siteLinks.github,
      },
    ],
    latencyLabel: "延迟",
    metricsLabel: "指标",
    navigatingLabel: "导航",
    runTerminalLabel: "在 Terminal Mode 分析",
    searchingLabel: "正在查询神经索引...",
    selectLabel: "选择",
    sourcesLabel: "来源",
    stepsLabel: "步骤",
    terminalEmptyLabel: "输入查询后可直接在面板内获得 AI 响应。",
    terminalFooterHint: "Terminal Mode 下回车会优先执行 AI 分析",
    terminalModeLabel: "终端模式",
    terminalPlaceholder: "输入命令，例如：ai architecture",
    terminalReadyLabel: "终端模式已就绪",
  },
  en: {
    aiResponseLabel: "AI RESPONSE",
    aiSuggestionLabel: "AI SUGGEST",
    askAiLabel: "Ask AI Assistant",
    artifactKindLabels: {
      executionReview: "Execution Review",
      knowledgeSignalRadar: "Knowledge Signal Radar",
      techRadar: "Tech Radar",
    },
    artifactsLabel: "ARTIFACTS",
    defaultModeLabel: "Default Mode",
    dialogDescription:
      "A global command palette for searching pages, triggering AI actions, and jumping to external links.",
    dialogTitle: "Global AI command palette",
    emptyLabel:
      "No direct match found. You can send the query to the chat interface.",
    enterLabel: "Enter",
    footerHint: "Press Ctrl / Cmd + K anytime",
    fitLabel: "Fit",
    groups: {
      ai: "AI Actions",
      links: "External Links",
      pages: "Pages",
    },
    inputPlaceholder: "Type a command or ask anything...",
    items: [
      {
        description: "Return to the homepage and capability overview",
        group: "pages",
        id: "page-home",
        keywords: ["home", "hero", "capabilities"],
        label: "Home",
        type: "route",
        url: "/",
      },
      {
        description: "Open the AI playground entry",
        group: "pages",
        id: "page-ai",
        keywords: ["ai", "playground", "chat", "agent"],
        label: "AI Playground",
        type: "route",
        url: "/ai",
      },
      {
        description: "Open the agent mission control demo",
        group: "pages",
        id: "page-agent",
        keywords: ["agent", "mission control"],
        label: "Agent Demo",
        type: "route",
        url: "/ai/agent",
      },
      {
        description: "Open the workflow editor",
        group: "pages",
        id: "page-workflow",
        keywords: ["workflow", "flow"],
        label: "Workflow Editor",
        type: "route",
        url: "/ai/workflow",
      },
      {
        description: "Open the evolution log",
        group: "pages",
        id: "page-evolution",
        keywords: ["evolution", "timeline"],
        label: "Evolution",
        type: "route",
        url: "/evolution",
      },
      {
        description: "Start a conversation with the AI assistant",
        group: "ai",
        id: "ai-chat",
        keywords: ["chat", "ask", "assistant", "agent"],
        label: "Chat with AI Assistant",
        type: "route",
        url: "/ai/chat",
      },
      {
        description: "Compare GPT and Claude side by side",
        group: "ai",
        id: "ai-arena",
        keywords: ["arena", "gpt", "claude", "compare"],
        label: "Compare GPT vs Claude",
        type: "route",
        url: "/ai/arena",
      },
      {
        description: "Open the knowledge retrieval surface",
        group: "ai",
        id: "ai-knowledge",
        keywords: ["knowledge", "rag", "search"],
        label: "Search knowledge",
        type: "route",
        url: "/ai/knowledge",
      },
      {
        description: "Open the standalone resume website",
        group: "links",
        id: "link-resume",
        keywords: ["resume", "profile"],
        label: "View resume",
        type: "external",
        url: siteLinks.resume,
      },
      {
        description: "Open the standalone blog website",
        group: "links",
        id: "link-blog",
        keywords: ["blog", "article"],
        label: "Read blog",
        type: "external",
        url: siteLinks.blog,
      },
      {
        description: "Open the GitHub profile",
        group: "links",
        id: "link-github",
        keywords: ["github", "source", "code"],
        label: "GitHub profile",
        type: "external",
        url: siteLinks.github,
      },
    ],
    latencyLabel: "Latency",
    metricsLabel: "Metrics",
    navigatingLabel: "Navigate",
    runTerminalLabel: "Analyze In Terminal Mode",
    searchingLabel: "Querying neural index...",
    selectLabel: "Select",
    sourcesLabel: "Sources",
    stepsLabel: "Steps",
    terminalEmptyLabel: "Type a query to get an inline AI response inside the palette.",
    terminalFooterHint: "In terminal mode, Enter prioritizes inline AI analysis",
    terminalModeLabel: "Terminal Mode",
    terminalPlaceholder: "Type a command, for example: ai architecture",
    terminalReadyLabel: "Terminal mode armed",
  },
};

function matchesPaletteItem(item: PaletteItem, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  return [item.label, item.description, item.url, ...item.keywords].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

function buildTerminalPreview(items: PaletteItem[], query: string) {
  const rows = items.slice(0, 4).map((item) => {
    const type = item.type === "route" ? "ROUTE" : "LINK ";
    const label = item.label.padEnd(20, " ").slice(0, 20);
    const target = item.url.padEnd(28, " ").slice(0, 28);

    return `| ${type} | ${label} | ${target} |`;
  });

  return [
    "+----------------------------------------------------------------+",
    "| TYPE  | TARGET               | RESOLVE                         |",
    "+----------------------------------------------------------------+",
    ...(rows.length
      ? rows
      : ["| IDLE  | waiting_input        | prompt the living interface     |"]),
    "+----------------------------------------------------------------+",
    "",
    `[SYSTEM]: ${items.length} commands indexed.`,
    `[QUERY]: ${query || "waiting input"}`,
    "[STATUS]: Terminal mode armed.",
  ].join("\n");
}

function describeArtifact(
  artifact: DemoChatResponse["artifacts"][number],
  copy: CommandPaletteCopy,
) {
  if (artifact.kind === "executionReview") {
    return `${copy.artifactKindLabels.executionReview} · ${copy.stepsLabel} ${artifact.payload.steps.length}`;
  }

  if (artifact.kind === "knowledgeSignalRadar") {
    return `${copy.artifactKindLabels.knowledgeSignalRadar} · ${copy.sourcesLabel} ${artifact.payload.sources.length} · ${copy.fitLabel} ${artifact.payload.efficiencyScore}% · ${copy.latencyLabel} ${artifact.payload.latencyMs.toFixed(1)}ms`;
  }

  if (artifact.kind === "techRadar") {
    return `${copy.artifactKindLabels.techRadar} · ${copy.metricsLabel} ${artifact.payload.metrics.length}`;
  }

  return copy.artifactKindLabels.techRadar;
}

export function SiteCommandPalette({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const copy = useLocalizedValue(commandPaletteCopyByLocale);
  const { locale } = useSiteLocale();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<PaletteMode>("default");
  const [analysis, setAnalysis] = useState<DemoChatResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [aiIntent, setAiIntent] = useState<IntentResult | null>(null);
  const intentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedSearch = search.trim();

  // Debounced AI intent detection (only in default mode)
  useEffect(() => {
    if (mode !== "default" || trimmedSearch.length < 4) {
      setAiIntent(null);
      return;
    }
    if (intentTimerRef.current) clearTimeout(intentTimerRef.current);
    intentTimerRef.current = setTimeout(() => {
      fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedSearch, locale }),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d) => setAiIntent(d as IntentResult))
        .catch(() => setAiIntent(null));
    }, 650);
    return () => {
      if (intentTimerRef.current) clearTimeout(intentTimerRef.current);
    };
  }, [trimmedSearch, mode, locale]);

  const filteredItems = useMemo(() => {
    return copy.items.filter((item) => matchesPaletteItem(item, trimmedSearch));
  }, [copy.items, trimmedSearch]);

  const groupedItems = useMemo(() => {
    return {
      ai: filteredItems.filter((item) => item.group === "ai"),
      links: filteredItems.filter((item) => item.group === "links"),
      pages: filteredItems.filter((item) => item.group === "pages"),
    };
  }, [filteredItems]);

  function handleSelect(item: PaletteItem) {
    setSearch("");
    setAnalysis(null);
    setAnalysisError(null);
    onOpenChange(false);

    if (item.type === "external") {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(item.url);
  }

  function handleAskAi() {
    if (!trimmedSearch) {
      return;
    }

    setSearch("");
    setAnalysis(null);
    setAnalysisError(null);
    onOpenChange(false);
    router.push(`/ai/chat?prompt=${encodeURIComponent(trimmedSearch)}`);
  }

  async function handleRunTerminalAnalysis() {
    if (!trimmedSearch || isRunning) {
      return;
    }

    setIsRunning(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          locale,
          messages: [{ content: trimmedSearch, role: "user" }],
          model: "gpt-5-mini",
          surface: "palette",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok || !response.body) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(errorPayload?.message ?? `Palette request failed with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      let meta: Partial<DemoChatResponse> = {};
      const artifacts: DemoChatResponse["artifacts"] = [];
      const pendingActions: Array<{ tool: string; result: Record<string, unknown> }> = [];

      const processEvent = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        try {
          const event = JSON.parse(trimmed) as Record<string, unknown>;
          if (event.type === "meta") {
            meta = {
              mode: (event.mode as "live" | "demo") ?? "live",
              model: (event.model as DemoChatResponse["model"]) ?? "gpt-5-mini",
              provider: (event.provider as string) ?? "",
              sources: (event.sources as DemoChatResponse["sources"]) ?? [],
              toolCalls: (event.toolCalls as DemoChatResponse["toolCalls"]) ?? [],
            };
          } else if (event.type === "chunk") {
            answer += event.content as string;
          } else if (event.type === "artifact" && event.kind && event.payload) {
            artifacts.push(
              { kind: event.kind, payload: event.payload } as DemoChatResponse["artifacts"][number],
            );
          } else if (event.type === "ui_action") {
            pendingActions.push({
              tool: event.tool as string,
              result: event.result as Record<string, unknown>,
            });
          }
        } catch { /* skip malformed lines */ }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) processEvent(line);
      }
      if (buffer.trim()) processEvent(buffer);

      setAnalysis({
        agent: "assistant",
        answer,
        artifacts,
        followUps: [],
        mode: meta.mode ?? "live",
        model: meta.model ?? "gpt-5-mini",
        provider: meta.provider ?? "",
        sources: meta.sources ?? [],
        toolCalls: meta.toolCalls ?? [],
      });

      // Execute UI actions from Generative UI tools
      for (const action of pendingActions) {
        if (action.tool === "navigateTo" && action.result.route) {
          setTimeout(() => {
            onOpenChange(false);
            router.push(action.result.route as string);
          }, 800);
        } else if (action.tool === "toggleTheme" && action.result.theme) {
          setTheme(action.result.theme as string);
        }
      }
    } catch (error) {
      setAnalysis(null);
      setAnalysisError(error instanceof Error ? error.message : copy.emptyLabel);
    } finally {
      setIsRunning(false);
    }
  }

  function handleToggleMode() {
    setMode((current) => (current === "default" ? "terminal" : "default"));
    setAnalysis(null);
    setAnalysisError(null);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch("");
      setAnalysis(null);
      setAnalysisError(null);
      setAiIntent(null);
      setMode("default");
    }

    onOpenChange(nextOpen);
  }

  return (
    <Command.Dialog
      label="Global command palette"
      onOpenChange={handleDialogOpenChange}
      open={open}
    >
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md" />
      <Dialog.Title className="sr-only">{copy.dialogTitle}</Dialog.Title>
      <Dialog.Description className="sr-only">
        {copy.dialogDescription}
      </Dialog.Description>
      <Command
        className={[
          "fixed left-1/2 top-[8vh] z-[80] h-[min(480px,calc(100vh-4rem))] w-[min(600px,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden md:top-[16vh]",
          mode === "terminal"
            ? "rounded-[24px] border border-cyan-400/20 bg-black text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            : "rounded-[28px] border border-white/10 bg-background/95 shadow-[0_0_80px_-24px_rgba(99,102,241,0.45)]",
        ].join(" ")}
        loop
        shouldFilter={false}
      >
        <div
          className={[
            "flex items-center gap-3 px-5",
            mode === "terminal"
              ? "h-16 border-b border-cyan-900/30 font-mono"
              : "border-b border-white/[0.08] py-4",
          ].join(" ")}
        >
          <span
            className={[
              mode === "terminal" ? "text-cyan-400" : "text-secondary",
              "shrink-0 text-sm",
            ].join(" ")}
          >
            {mode === "terminal" ? "$" : "✦"}
          </span>
          <Command.Input
            className={[
              "w-full bg-transparent outline-none",
              mode === "terminal"
                ? "font-mono text-lg text-cyan-400 placeholder:text-cyan-900/60"
                : "font-body-ui text-base text-foreground placeholder:text-foreground-muted",
            ].join(" ")}
            onValueChange={(value) => {
              setSearch(value);
              if (mode === "terminal") {
                setAnalysis(null);
                setAnalysisError(null);
              }
            }}
            placeholder={mode === "terminal" ? copy.terminalPlaceholder : copy.inputPlaceholder}
            value={search}
          />
          <button
            className={[
              "shrink-0 rounded px-2 py-1 text-[10px] uppercase tracking-[0.22em]",
              mode === "terminal"
                ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                : "border border-white/[0.08] bg-white/[0.04] text-foreground-muted",
            ].join(" ")}
            onClick={handleToggleMode}
            type="button"
          >
            {mode === "terminal" ? copy.defaultModeLabel : copy.terminalModeLabel}
          </button>
          <span
            className={[
              "shrink-0 rounded px-2 py-1 text-[10px] uppercase tracking-[0.22em]",
              mode === "terminal"
                ? "border border-cyan-900/30 text-cyan-700"
                : "border border-outline-variant/30 bg-surface-low text-foreground-muted",
            ].join(" ")}
          >
            ESC
          </span>
        </div>

        <Command.List
          className={[
            "max-h-[420px] overflow-y-auto",
            mode === "terminal" ? "p-2 font-mono" : "p-3",
          ].join(" ")}
        >
          {trimmedSearch ? (
            <Command.Item
              className={[
                "mb-2 flex cursor-pointer items-start justify-between rounded-[22px] px-4 py-4 text-left outline-none transition-colors",
                mode === "terminal"
                  ? "border border-cyan-500/20 bg-cyan-500/5 data-[selected=true]:bg-cyan-500/10"
                  : "bg-white/[0.04] data-[selected=true]:bg-primary/12",
              ].join(" ")}
              onSelect={() => {
                if (mode === "terminal") {
                  void handleRunTerminalAnalysis();
                  return;
                }

                handleAskAi();
              }}
              value={`${mode}-${trimmedSearch}`}
            >
              <div>
                <p
                  className={[
                    "text-base font-semibold tracking-[-0.03em]",
                    mode === "terminal"
                      ? "font-mono text-cyan-300"
                      : "font-display-ui text-primary",
                  ].join(" ")}
                >
                  {mode === "terminal" ? copy.runTerminalLabel : copy.askAiLabel}
                </p>
                <p
                  className={[
                    "mt-1 text-sm leading-6",
                    mode === "terminal" ? "font-mono text-cyan-400/70" : "text-foreground-muted",
                  ].join(" ")}
                >
                  {trimmedSearch}
                </p>
              </div>
              <span
                className={[
                  "text-[11px] uppercase tracking-[0.2em]",
                  mode === "terminal" ? "font-mono text-cyan-600" : "font-label-ui text-foreground-muted",
                ].join(" ")}
              >
                {copy.enterLabel}
              </span>
            </Command.Item>
          ) : null}

          {/* AI Intent Suggestion — only in default mode */}
          {mode === "default" && aiIntent && aiIntent.confidence >= 0.6 && trimmedSearch ? (
            <Command.Item
              className="mb-2 flex cursor-pointer items-start justify-between rounded-[18px] border border-secondary/15 bg-secondary/5 px-4 py-3 text-left outline-none transition-colors data-[selected=true]:bg-secondary/10"
              onSelect={() => {
                setSearch("");
                setAiIntent(null);
                onOpenChange(false);
                if (aiIntent.route) {
                  router.push(aiIntent.route);
                } else {
                  router.push(`/ai/chat?prompt=${encodeURIComponent(trimmedSearch)}`);
                }
              }}
              value={`intent-${trimmedSearch}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-sm text-secondary">✦</span>
                <div>
                  <p className="font-display-ui text-sm font-semibold tracking-[-0.02em] text-secondary">
                    {aiIntent.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-foreground-muted">
                    {aiIntent.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <span className="font-label-ui text-[9px] uppercase tracking-[0.2em] text-foreground-muted/60">
                  {copy.aiSuggestionLabel}
                </span>
                <span className="font-label-ui text-[9px] uppercase tracking-[0.16em] text-secondary/60">
                  {Math.round(aiIntent.confidence * 100)}%
                </span>
              </div>
            </Command.Item>
          ) : null}

          {mode === "terminal" ? (
            <div className="mb-3 rounded-[18px] border border-cyan-900/30 bg-black px-4 py-4">
              <pre className="overflow-x-auto text-xs leading-relaxed text-cyan-400">
                {buildTerminalPreview(filteredItems, trimmedSearch)}
              </pre>

              <div className="mt-6 border-t border-cyan-900/30 pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-sm border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                    {copy.aiResponseLabel}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-cyan-900/50 to-transparent" />
                </div>

                {isRunning ? (
                  <p className="text-sm leading-relaxed text-cyan-300/80">
                    {copy.searchingLabel}
                  </p>
                ) : analysisError ? (
                  <p className="text-sm leading-relaxed text-[#ff8b8b]">
                    {analysisError}
                  </p>
                ) : analysis ? (
                  <div className="space-y-3 text-sm leading-relaxed text-cyan-300/80">
                    <p>{analysis.answer}</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.sources.map((source) => (
                        <span
                          className="rounded border border-cyan-900/40 bg-cyan-500/5 px-2 py-1 text-[11px] text-cyan-300"
                          key={`${source.path}-${source.title}`}
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                    {analysis.artifacts.length ? (
                      <div className="space-y-2 border-t border-cyan-900/30 pt-3">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-600">
                          {copy.artifactsLabel}
                        </div>
                        <div className="space-y-2">
                          {analysis.artifacts.map((artifact, index) => (
                            <div
                              className="rounded border border-cyan-900/40 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-300"
                              key={`${artifact.kind}-${index}`}
                            >
                              {describeArtifact(artifact, copy)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-cyan-400/60">
                    {trimmedSearch ? copy.terminalReadyLabel : copy.terminalEmptyLabel}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {filteredItems.length === 0 && !trimmedSearch ? (
            <div className="px-4 py-10 text-center text-sm text-foreground-muted">
              {mode === "terminal" ? copy.terminalEmptyLabel : copy.emptyLabel}
            </div>
          ) : null}

          {filteredItems.length === 0 && trimmedSearch && mode === "default" ? (
            <div className="px-4 py-10 text-center text-sm text-foreground-muted">
              {copy.emptyLabel}
            </div>
          ) : null}

          {/* Easter Egg #3: "hire" keyword */}
          {mode === "default" && /hire|招聘|offer|opportunity|job|work together|合作/i.test(trimmedSearch) ? (
            <Command.Group heading={locale === "zh" ? "🥚 彩蛋" : "🥚 Easter Egg"}>
              <Command.Item
                className="group flex cursor-pointer items-start gap-3 rounded-[20px] px-4 py-3 outline-none data-[selected=true]:bg-white/[0.06]"
                onSelect={() => {
                  window.open("mailto:hello@yoursite.example.com", "_blank");
                  setSearch("");
                  onOpenChange(false);
                }}
                value="hire-easter-egg"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 text-lg">
                  ✉️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-sm font-semibold tracking-[-0.02em] text-transparent font-display-ui" style={{ backgroundSize: "200% 200%", animation: "hire-shimmer 2s ease infinite" }}>
                    {locale === "zh" ? "📬 联系我 — 聊聊合作机会" : "📬 Get in touch — Let's talk opportunities"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">
                    {locale === "zh"
                      ? "你发现了第 3 个彩蛋 🥚  发个邮件，我会认真回复。"
                      : "You found Easter egg #3 🥚  Send an email, I'll reply thoughtfully."}
                  </p>
                </div>
                <span className="font-label-ui shrink-0 text-[10px] uppercase tracking-[0.18em] text-purple-400/60">
                  {locale === "zh" ? "发送邮件" : "send email"}
                </span>
              </Command.Item>
            </Command.Group>
          ) : null}

          {(Object.keys(groupedItems) as PaletteGroupKey[]).map((groupKey) =>
            groupedItems[groupKey].length ? (
              <Command.Group
                heading={copy.groups[groupKey]}
                key={groupKey}
                className="mb-2"
              >
                {groupedItems[groupKey].map((item) => (
                  <Command.Item
                    className={[
                      "flex cursor-pointer items-start gap-3 outline-none transition-colors",
                      mode === "terminal"
                        ? "rounded-[16px] px-4 py-3 font-mono data-[selected=true]:bg-cyan-500/8"
                        : "rounded-[20px] px-4 py-3 data-[selected=true]:bg-white/[0.06]",
                    ].join(" ")}
                    key={item.id}
                    keywords={item.keywords}
                    onSelect={() => handleSelect(item)}
                    value={item.label}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          "text-sm font-semibold tracking-[-0.02em]",
                          mode === "terminal"
                            ? "font-mono text-cyan-300"
                            : "font-display-ui text-foreground",
                        ].join(" ")}
                      >
                        {item.label}
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm leading-6",
                          mode === "terminal"
                            ? "font-mono text-cyan-400/70"
                            : "text-foreground-muted",
                        ].join(" ")}
                      >
                        {item.description}
                      </p>
                    </div>
                    <span
                      className={[
                        "shrink-0 text-[10px] uppercase tracking-[0.18em]",
                        mode === "terminal" ? "font-mono text-cyan-700" : "font-label-ui text-foreground-muted/60",
                      ].join(" ")}
                    >
                      {item.type === "route" ? copy.navigatingLabel : copy.selectLabel}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null,
          )}
        </Command.List>

        <div
          className={[
            "px-5 py-3",
            mode === "terminal"
              ? "border-t border-cyan-900/30"
              : "border-t border-white/[0.08]",
          ].join(" ")}
        >
          <p
            className={[
              "text-[11px] uppercase tracking-[0.24em]",
              mode === "terminal"
                ? "font-mono text-cyan-700"
                : "font-label-ui text-foreground-muted",
            ].join(" ")}
          >
            {mode === "terminal" ? copy.terminalFooterHint : copy.footerHint}
          </p>
        </div>
      </Command>
    </Command.Dialog>
  );
}
