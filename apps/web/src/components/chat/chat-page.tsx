"use client";

import {
  chatModelOptions,
  siteAgent,
  type AiArtifact,
  type ChatModelId,
  type DemoChatResponse,
} from "@ai-site/ai";
import { ArtifactRenderer } from "./artifact-renderer";
import { type LocalizedValue } from "@ai-site/content";
import { GlassPanel, SignalPill, SurfaceCard } from "@ai-site/ui";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { recordAiChat } from "@/hooks/use-visitor-counter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Zap,
  Check,
  Terminal,
  Plus,
  ArrowUp,
  ArrowRight,
  Monitor,
  BarChart3,
  X as XIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { AccentEyebrow } from "../ai-pages/shared";
import { useLocalizedValue, useSiteLocale } from "../locale-provider";
import {
  getHighlighter,
  mapToShikiLang,
  createLineNumberTransformer,
} from "@/lib/shiki";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatPageCopy {
  analysisLabel: string;
  agentLabel: string;
  attachmentPreviewLabel: string;
  cancelLabel: string;
  composerHint: string;
  completedLabel: string;
  contextButtonLabel: string;
  contextDescription: string;
  contextEyebrow: string;
  contextTitle: string;
  demoBadge: string;
  efficiencyLabel: string;
  emptySources: string;
  emptyToolCalls: string;
  errorMessage: string;
  foundSourcesLabel: string;
  inputPlaceholder: string;
  latencyLabel: string;
  liveLabel: string;
  modelLabel: string;
  pendingLabel: string;
  runtimeLabel: string;
  searchingKnowledgeLabel: string;
  sendLabel: string;
  sendingLabel: string;
  sourceLabel: string;
  suggestions: string[];
  suggestionsLabel: string;
  traceLabel: string;
  toolCallsLabel: string;
  usedToolsLabel: string;
  welcome: string;
}

interface UiActionEvent {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

interface ChatMessage {
  artifacts?: AiArtifact[];
  content: string;
  id: string;
  image?: string;
  isStreaming?: boolean;
  meta?: {
    mode?: string;
    model?: string;
    provider?: string;
    sources: Array<{ path: string; title: string }>;
    toolCalls: Array<{ name: string; detail: string; status: string }>;
  };
  role: "assistant" | "user";
  uiActions?: UiActionEvent[];
}

// ─── I18n ────────────────────────────────────────────────────────────────────

const chatPageCopyByLocale: LocalizedValue<ChatPageCopy> = {
  zh: {
    analysisLabel: "上下文性能分析",
    agentLabel: "当前 Agent",
    attachmentPreviewLabel: "上下文预览",
    cancelLabel: "取消",
    composerHint: "Enter 发送，Shift + Enter 换行，⌘ + Enter 可同时使用",
    completedLabel: "已完成",
    contextButtonLabel: "Context",
    contextDescription:
      "这里会持续暴露当前 Agent、模型、最近一次工具调用与引用来源，后续再升级成真正透明的 reasoning trace。",
    contextEyebrow: "Context Panel",
    contextTitle: "透明化 AI 决策过程",
    demoBadge: "GPT Runtime",
    efficiencyLabel: "匹配度",
    emptySources: "本轮回复还没有引用来源。",
    emptyToolCalls: "等待下一次工具调用。",
    errorMessage: "GPT 对话暂时不可用，请检查 OpenAI 配置后再试。",
    foundSourcesLabel: "已发现来源",
    inputPlaceholder: "输入你的问题，例如：这个项目用了哪些 AI 技术？",
    latencyLabel: "延迟",
    liveLabel: "实时",
    modelLabel: "当前模型",
    pendingLabel: "处理中",
    runtimeLabel: "运行模式",
    searchingKnowledgeLabel: "搜索知识库中...",
    sendLabel: "发送",
    sendingLabel: "生成中...",
    sourceLabel: "引用来源",
    suggestions: [
      "这个项目用了哪些 AI 技术？",
      "这套网站的架构为什么这样设计？",
      "国际化和字体体系现在做到哪了？",
    ],
    suggestionsLabel: "快速开始",
    traceLabel: "认知轨迹",
    toolCallsLabel: "工具调用",
    usedToolsLabel: "已使用工具",
    welcome:
      "你好，我是这个网站的 AI 助手。你可以问我项目架构、AI 方向、设计思路、部署方案，或者直接让我解释当前站点进度。",
  },
  en: {
    analysisLabel: "Stack Performance Analysis",
    agentLabel: "Current agent",
    attachmentPreviewLabel: "Context Preview",
    cancelLabel: "Cancel",
    composerHint: "Press Enter to send, Shift + Enter for newline",
    completedLabel: "completed",
    contextButtonLabel: "Context",
    contextDescription:
      "This panel exposes the current agent, model, latest tool calls, and cited sources.",
    contextEyebrow: "Context Panel",
    contextTitle: "Transparent AI decision context",
    demoBadge: "GPT Runtime",
    efficiencyLabel: "Efficiency",
    emptySources: "No cited sources for this turn yet.",
    emptyToolCalls: "Waiting for the next tool invocation.",
    errorMessage:
      "GPT chat is temporarily unavailable. Check the OpenAI configuration and try again.",
    foundSourcesLabel: "Found sources",
    inputPlaceholder:
      "Ask anything, for example: What AI projects have you built?",
    latencyLabel: "Latency",
    liveLabel: "live",
    modelLabel: "Current model",
    pendingLabel: "pending",
    runtimeLabel: "Runtime",
    searchingKnowledgeLabel: "Searching knowledge base...",
    sendLabel: "Send",
    sendingLabel: "Generating...",
    sourceLabel: "Sources",
    suggestions: [
      "What AI technologies does this project use?",
      "Why is this site architecture designed this way?",
      "How far is the i18n and typography system now?",
    ],
    suggestionsLabel: "Quick start",
    traceLabel: "Cognitive Trace",
    toolCallsLabel: "Tool calls",
    usedToolsLabel: "Used tools",
    welcome:
      "Hello. I'm the AI assistant for this site. Ask me about the project architecture, AI direction, design thinking, deployment model, or the current state of this platform.",
  },
};

const modelToneClassNames: Record<ChatModelId, string> = {
  "gpt-5": "text-primary",
  "gpt-5-mini": "text-secondary",
  "claude-sonnet": "text-tertiary",
};

function createId() { return crypto.randomUUID(); }

// ─── Shiki Code Block (inline, for chat messages) ────────────────────────────

function ChatCodeBlock({ code, language }: { code: string; language: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const lines = code.split(/\r?\n/);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((h) => {
        const result = h.codeToHtml(code, {
          lang: mapToShikiLang(language),
          theme: "github-dark",
          transformers: [createLineNumberTransformer()],
        });
        if (!cancelled) setHtml(result);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [code, language]);

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5">
        <span className="font-label-ui text-[10px] uppercase tracking-[0.14em] text-foreground-muted/50">{language}</span>
        <span className="font-label-ui text-[10px] text-foreground-muted/30">{lines.length} lines</span>
      </div>
      {html ? (
        <div className="shiki-code-block max-h-[400px] overflow-auto px-0 py-2" style={{ scrollbarWidth: "thin" }} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="max-h-[400px] overflow-auto px-4 py-2 text-[12px] leading-6 text-foreground-muted" style={{ scrollbarWidth: "thin" }}>
          {code}
        </pre>
      )}
    </div>
  );
}

// ─── Inline HTML Preview ─────────────────────────────────────────────────────

function InlineHtmlPreview({ html, locale }: { html: string; locale: string }) {
  const [open, setOpen] = useState(false);
  if (!html.includes("<") || html.length < 100) return null;

  const previewLabel = locale === "zh" ? "预览" : "Preview";
  const titleLabel = locale === "zh" ? "HTML 预览" : "HTML Preview";
  const closeLabel = locale === "zh" ? "关闭" : "Close";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="my-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] text-primary transition-colors hover:bg-primary/20"
      >
        <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />
        {previewLabel}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          tabIndex={-1}
          ref={(el) => { if (el && document.activeElement !== el) el.focus(); }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
            <span className="font-label-ui text-[10px] uppercase tracking-[0.16em] text-foreground-muted">{titleLabel}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-label-ui text-[10px] uppercase text-foreground-muted hover:bg-white/10">{closeLabel}</button>
          </div>
          <div className="flex-1 overflow-hidden bg-white">
            <iframe srcDoc={html} className="h-full w-full border-0" sandbox="allow-scripts" title={titleLabel} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Markdown Components for Chat Messages ───────────────────────────────────

function buildChatMarkdownComponents(locale: string): Record<string, React.ComponentType<Record<string, unknown>>> {
  return {
    h1: (p) => <h1 className="mb-2 mt-4 text-xl font-semibold text-foreground" {...p} />,
    h2: (p) => <h2 className="mb-2 mt-3 text-lg font-semibold text-foreground" {...p} />,
    h3: (p) => <h3 className="mb-1 mt-3 text-base font-semibold text-foreground" {...p} />,
    p: (p) => <p className="mb-2.5 text-[1rem] leading-relaxed text-foreground-muted" {...p} />,
    ul: (p) => <ul className="mb-2.5 list-disc space-y-1 pl-5 text-[1rem] leading-relaxed text-foreground-muted" {...p} />,
    ol: (p) => <ol className="mb-2.5 list-decimal space-y-1 pl-5 text-[1rem] leading-relaxed text-foreground-muted" {...p} />,
    li: (p) => <li className="text-[1rem] leading-relaxed" {...p} />,
    blockquote: (p) => <blockquote className="my-2 border-l-2 border-primary/30 pl-4 italic text-foreground-muted/70" {...p} />,
    strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
    em: (p) => <em className="italic text-foreground-muted/80" {...p} />,
    a: (p) => <a className="text-primary underline decoration-primary/30 hover:decoration-primary/60" target="_blank" rel="noopener noreferrer" {...p} />,
    hr: () => <hr className="my-3 border-white/10" />,
    table: (p) => <div className="my-2 overflow-x-auto"><table className="w-full text-sm" {...p} /></div>,
    th: (p) => <th className="border border-white/10 bg-white/5 px-3 py-2 text-left font-semibold text-foreground" {...p} />,
    td: (p) => <td className="border border-white/10 px-3 py-2 text-foreground-muted/80" {...p} />,
    code: ({ className, children, ...rest }: { className?: string; children?: React.ReactNode;[k: string]: unknown }) => {
      const match = /language-(\w+)/.exec(className || "");
      const codeStr = String(children).replace(/\n$/, "");
      if (match) {
        const lang = match[1];
        const isHtml = lang === "html" && codeStr.length > 200 && codeStr.includes("<");
        return (
          <>
            <ChatCodeBlock code={codeStr} language={lang} />
            {isHtml && <InlineHtmlPreview html={codeStr} locale={locale} />}
          </>
        );
      }
      return <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-primary/90" {...rest}>{children}</code>;
    },
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
}

// ─── SVG Icons (Lucide) ──────────────────────────────────────────────────────

function SparkleIcon() {
  return <Sparkles aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />;
}

function BoltIcon() {
  return <Zap aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />;
}

function CheckIcon() {
  return <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />;
}

function TerminalIcon() {
  return <Terminal aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />;
}

function PlusIcon() {
  return <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />;
}

function ArrowUpIcon() {
  return <ArrowUp aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />;
}

// ─── UI Action Cards ─────────────────────────────────────────────────────────

function UiActionCards({ actions, locale }: { actions: UiActionEvent[]; locale: "zh" | "en" }) {
  if (actions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-2">
      {actions.map((action, i) => (
        <UiActionCard key={i} action={action} locale={locale} />
      ))}
    </div>
  );
}

function UiActionCard({ action, locale }: { action: UiActionEvent; locale: "zh" | "en" }) {
  const result = action.result as Record<string, unknown>;

  if (action.tool === "navigateTo") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 animate-fade-up">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ArrowRight className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="font-label-ui text-[10px] uppercase tracking-[0.2em] text-primary/60">
            {locale === "zh" ? "页面导航" : "Navigation"}
          </p>
          <p className="text-sm font-medium text-foreground">
            {result.label as string}
          </p>
        </div>
        <span className="ml-auto font-mono text-[11px] text-foreground-muted/40">
          {result.route as string}
        </span>
      </div>
    );
  }

  if (action.tool === "toggleTheme") {
    const icons: Record<string, string> = { light: "☀️", dark: "🌙", system: "💻" };
    return (
      <div className="flex items-center gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 animate-fade-up">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-lg">
          {icons[(result.theme as string)] ?? "🎨"}
        </div>
        <div className="min-w-0">
          <p className="font-label-ui text-[10px] uppercase tracking-[0.2em] text-secondary/60">
            {locale === "zh" ? "主题切换" : "Theme"}
          </p>
          <p className="text-sm font-medium text-foreground">
            {result.label as string}
          </p>
        </div>
      </div>
    );
  }

  if (action.tool === "showSkills") {
    const skills = (result.skills as Array<{ name: string; level: number; category: string }>) ?? [];
    return (
      <div className="rounded-xl border border-outline-variant/20 bg-surface-low/50 p-4 animate-fade-up">
        <p className="mb-3 font-label-ui text-[10px] uppercase tracking-[0.2em] text-foreground-muted/50">
          {locale === "zh" ? "技术栈" : "Tech Stack"}
          {result.category !== "All" && ` · ${result.category}`}
        </p>
        <div className="space-y-2">
          {skills.map((skill) => (
            <div key={skill.name} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-foreground-muted">{skill.name}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-outline-variant/20">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary/70 transition-all duration-700"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[11px] text-foreground-muted/50">
                {skill.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (action.tool === "showProjects") {
    const projects = (result.projects as Array<{ title: string; summary: string; tags: string[]; href?: string }>) ?? [];
    return (
      <div className="rounded-xl border border-outline-variant/20 bg-surface-low/50 p-4 animate-fade-up">
        <p className="mb-3 font-label-ui text-[10px] uppercase tracking-[0.2em] text-foreground-muted/50">
          {locale === "zh" ? "项目" : "Projects"}
        </p>
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.title} className="rounded-lg border border-outline-variant/10 bg-surface-high/30 p-3">
              <p className="text-sm font-medium text-foreground">{project.title}</p>
              <p className="mt-1 text-xs text-foreground-muted">{project.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 font-label-ui text-[9px] uppercase tracking-[0.15em] text-primary/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Collapsible Artifacts ───────────────────────────────────────────────────

function CollapsibleArtifacts({
  artifacts,
  locale,
}: {
  artifacts: AiArtifact[];
  locale: "zh" | "en";
}) {
  const [open, setOpen] = useState(false);

  const kindLabel: Record<string, string> = {
    executionReview: locale === "zh" ? "执行追踪" : "Execution Trace",
    knowledgeSignalRadar: locale === "zh" ? "知识信号" : "Knowledge Signal",
    projectTimeline: locale === "zh" ? "项目时间线" : "Project Timeline",
    techRadar: locale === "zh" ? "技术雷达" : "Tech Radar",
  };

  return (
    <div className="mt-4">
      <button
        className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-low/50 px-3 py-1.5 font-label-ui text-[10px] uppercase tracking-[0.2em] text-foreground-muted/50 transition-all hover:border-primary/20 hover:text-primary/60"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={["transition-transform duration-200", open ? "rotate-90" : ""].join(" ")}>▶</span>
        {open
          ? (locale === "zh" ? "收起 AI 分析" : "Hide AI Analysis")
          : (locale === "zh" ? `展开 AI 分析 (${artifacts.length})` : `Show AI Analysis (${artifacts.length})`)}
      </button>

      {open && (
        <div className="mt-2 space-y-1 animate-fade-up">
          {artifacts.map((art, i) => (
            <div key={i}>
              <p className="mb-1 mt-3 font-label-ui text-[9px] uppercase tracking-[0.25em] text-foreground-muted/30">
                {kindLabel[art.kind] ?? art.kind}
              </p>
              <ArtifactRenderer artifact={art} locale={locale} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ChatPage() {
  const copy = useLocalizedValue(chatPageCopyByLocale);
  const { locale } = useSiteLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTheme } = useTheme();
  const consumedPromptRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Typewriter buffer refs — shared across the active stream
  const twBufRef = useRef<string>("");          // chars received but not yet displayed
  const twDisplayRef = useRef<string>("");      // chars currently shown for active stream
  const twIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Smart auto-scroll: only follow bottom when user hasn't scrolled up
  const userScrolledRef = useRef(false);
  // Mounted guard to prevent setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [selectedModel, setSelectedModel] = useState<ChatModelId>("gpt-5-mini");
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { content: copy.welcome, id: createId(), role: "assistant" },
  ]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length > 1) return current;
      return [{ content: copy.welcome, id: current[0]?.id ?? createId(), role: "assistant" }];
    });
  }, [copy.welcome]);

  const scrollToBottom = useCallback((force = false) => {
    const el = scrollRef.current;
    if (!el) return;
    if (!force && userScrolledRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // Detect manual upward scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledRef.current = distFromBottom > 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Only force-scroll when a new message is added (not on every typewriter tick)
  const msgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length !== msgCountRef.current) {
      msgCountRef.current = messages.length;
      userScrolledRef.current = false;
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  const latestAssistantMeta = useMemo(() => {
    return [...messages].reverse().find((m) => m.role === "assistant" && m.meta)?.meta;
  }, [messages]);


  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAttachedImage(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    },
    [handleImageFile],
  );

  const activeModel = useMemo(() => {
    return chatModelOptions.find((o) => o.id === selectedModel) ?? chatModelOptions[0];
  }, [selectedModel]);

  const sendMessage = useCallback(
    async (rawInput: string, imageData?: string | null) => {
      const text = rawInput.trim();
      if (!text && !imageData) return;
      if (isPending) return;
      const content = text || (locale === "zh" ? "请分析这张图片" : "Please analyze this image");

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessage = { content, id: createId(), role: "user" };
      const assistantId = createId();

      // Reset typewriter state for new stream
      twBufRef.current = "";
      twDisplayRef.current = "";
      if (twIntervalRef.current) clearInterval(twIntervalRef.current);

      setInput("");
      setAttachedImage(null);
      setIsPending(true);
      setMessages((current) => [
        ...current,
        { ...userMessage, image: imageData ?? undefined },
        { content: "", id: assistantId, isStreaming: true, role: "assistant" },
      ]);

      // Typewriter interval: drain buffer at adaptive speed
      // Slower when buffer is small (smooth feel), faster when lagging behind
      twIntervalRef.current = setInterval(() => {
        if (twBufRef.current.length === 0) return;
        const pending = twBufRef.current.length;
        const charsPerTick = pending > 200 ? 10 : pending > 60 ? 5 : pending > 15 ? 3 : 2;
        const released = twBufRef.current.slice(0, charsPerTick);
        twBufRef.current = twBufRef.current.slice(charsPerTick);
        twDisplayRef.current += released;
        const displayed = twDisplayRef.current;
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, content: displayed, isStreaming: true } : m,
        ));
        scrollToBottom();
      }, 35);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            messages: [
              ...messages.map((m) => ({ content: m.content, role: m.role })),
              imageData
                ? {
                    content: [
                      { type: "text" as const, text: content },
                      { type: "image" as const, image: imageData },
                    ],
                    role: "user",
                  }
                : { content, role: "user" },
            ],
            model: selectedModel,
            surface: "chat",
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errPayload = await res.json().catch(() => null) as { message?: string } | null;
          throw new Error(errPayload?.message ?? `Chat request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let hadError = false;
        const pendingUiActions: UiActionEvent[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed) as Record<string, unknown>;

              if (event.type === "meta") {
                setMessages((prev) => prev.map((m) =>
                  m.id === assistantId ? {
                    ...m,
                    meta: {
                      mode: event.mode as string,
                      model: event.model as string,
                      provider: event.provider as string,
                      sources: (event.sources as Array<{ path: string; title: string }>) ?? [],
                      toolCalls: (event.toolCalls as Array<{ name: string; detail: string; status: string }>) ?? [],
                    },
                  } : m,
                ));
              } else if (event.type === "chunk") {
                // Push into typewriter buffer instead of rendering directly
                fullText += event.content as string;
                twBufRef.current += event.content as string;
              } else if (event.type === "artifact") {
                const incoming = { kind: event.kind, payload: event.payload } as AiArtifact;
                setMessages((prev) => prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, artifacts: [...(m.artifacts ?? []), incoming] }
                    : m,
                ));
              } else if (event.type === "ui_action") {
                const action = { tool: event.tool, args: event.args, result: event.result } as UiActionEvent;
                pendingUiActions.push(action);
                setMessages((prev) => prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, uiActions: [...(m.uiActions ?? []), action] }
                    : m,
                ));
              } else if (event.type === "error") {
                hadError = true;
                if (twIntervalRef.current) { clearInterval(twIntervalRef.current); twIntervalRef.current = null; }
                setMessages((prev) => prev.map((m) =>
                  m.id === assistantId ? { ...m, content: event.error as string, isStreaming: false } : m,
                ));
              }
            } catch { /* skip malformed line */ }
          }
        }

        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer.trim()) as Record<string, unknown>;
            if (event.type === "chunk") {
              fullText += event.content as string;
              twBufRef.current += event.content as string;
            }
          } catch { /* skip */ }
        }

        // Drain remaining buffer then snap to full text
        if (!hadError) {
          // Increment live AI chat counter (fire-and-forget)
          recordAiChat();
          // Wait for typewriter to drain (max 3s) then snap
          const snapAfterDrain = () => {
            if (twIntervalRef.current) { clearInterval(twIntervalRef.current); twIntervalRef.current = null; }
            setMessages((prev) => prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullText || m.content, isStreaming: false } : m,
            ));
          };
          // Give typewriter ~2s to drain naturally, then force-snap
          const drainStart = Date.now();
          const drainCheck = setInterval(() => {
            if (twBufRef.current.length === 0 || Date.now() - drainStart > 2000) {
              clearInterval(drainCheck);
              if (mountedRef.current) snapAfterDrain();
            }
          }, 50);

          // Execute pending UI actions after a brief delay for visual continuity
          if (pendingUiActions.length > 0) {
            setTimeout(() => {
              for (const ua of pendingUiActions) {
                if (ua.tool === "navigateTo" && ua.result && typeof ua.result === "object" && "route" in ua.result) {
                  router.push(ua.result.route as string);
                } else if (ua.tool === "toggleTheme" && ua.result && typeof ua.result === "object" && "theme" in ua.result) {
                  setTheme(ua.result.theme as string);
                }
              }
            }, 1500);
          }
        }
      } catch (error) {
        if (twIntervalRef.current) { clearInterval(twIntervalRef.current); twIntervalRef.current = null; }
        if (error instanceof DOMException && error.name === "AbortError") {
          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, content: twDisplayRef.current || m.content, isStreaming: false } : m,
          ));
        } else {
          console.error(error);
          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, content: error instanceof Error ? error.message : copy.errorMessage, isStreaming: false } : m,
          ));
        }
      } finally {
        abortRef.current = null;
        setIsPending(false);
      }
    },
    [copy.errorMessage, isPending, locale, messages, selectedModel],
  );

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (!prompt || consumedPromptRef.current === prompt) return;
    consumedPromptRef.current = prompt;
    void sendMessage(prompt);
    router.replace("/ai/chat");
  }, [router, searchParams, sendMessage]);

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input, attachedImage);
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void sendMessage(input, attachedImage);
    }
  }

  const chatMarkdownComponents = useMemo(() => buildChatMarkdownComponents(locale), [locale]);

  const conversationSuggestions = copy.suggestions;
  const latestPreviewSource = latestAssistantMeta?.sources?.[0];

  return (
    <main className="relative min-h-screen overflow-x-hidden pb-72 pt-28 md:pt-32">
      <div className="pointer-events-none absolute inset-0 aurora-gradient" />
      <div className="pointer-events-none absolute left-[8%] top-0 h-[32rem] w-[32rem] rounded-full bg-primary/8 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-8%] left-[-6%] h-[28rem] w-[28rem] rounded-full bg-secondary/6 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-4%] top-20 h-[36rem] w-[36rem] rounded-full bg-primary/6 blur-[150px]" />

      {/* Context panel toggle */}
      <button
        className="fixed right-4 top-24 z-30 inline-flex items-center gap-2 rounded-full border border-primary/12 bg-[#0e0e0e]/60 px-4 py-2 text-sm text-foreground-muted backdrop-blur-[20px] transition-all hover:border-primary/30 hover:text-primary md:right-8"
        onClick={() => setIsContextOpen((v) => !v)}
        type="button"
      >
        <SparkleIcon />
        <span>✦ {copy.contextButtonLabel}</span>
      </button>

      {isContextOpen && (
        <button
          aria-label={copy.contextButtonLabel}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsContextOpen(false)}
          type="button"
        />
      )}

      {/* Context aside */}
      <aside
        className={[
          "fixed inset-x-4 bottom-[8.5rem] z-30 transition-all duration-300 lg:inset-x-auto lg:bottom-8 lg:right-6 lg:top-28 lg:w-[360px]",
          isContextOpen
            ? "translate-y-0 opacity-100 lg:translate-x-0"
            : "pointer-events-none translate-y-4 opacity-0 lg:translate-x-4 lg:translate-y-0",
        ].join(" ")}
      >
        <GlassPanel className="h-full max-h-[calc(100vh-9rem)] overflow-y-auto rounded-[28px] border border-white/[0.08] bg-black/50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.42)]">
          <AccentEyebrow accent="primary">{copy.contextEyebrow}</AccentEyebrow>
          <h2 className="font-display-ui mt-4 text-3xl font-semibold tracking-[-0.05em]">{copy.contextTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-foreground-muted">{copy.contextDescription}</p>

          <div className="mt-8 space-y-6">
            <section>
              <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">{copy.agentLabel}</p>
              <p className="font-display-ui mt-3 text-xl font-semibold tracking-[-0.03em]">{siteAgent.name}</p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <SurfaceCard padding="md" radius="md">
                <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">{copy.modelLabel}</p>
                <p className="mt-3 text-sm leading-6 text-foreground">{activeModel.label} / {activeModel.provider}</p>
              </SurfaceCard>
              <SurfaceCard padding="md" radius="md">
                <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">{copy.runtimeLabel}</p>
                <p className="mt-3 text-sm leading-6 text-foreground">{latestAssistantMeta?.mode ?? copy.liveLabel}</p>
              </SurfaceCard>
            </section>

            <section>
              <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">{copy.toolCallsLabel}</p>
              <div className="mt-3 grid gap-3">
                {latestAssistantMeta?.toolCalls?.length ? (
                  latestAssistantMeta.toolCalls.map((tc) => (
                    <SurfaceCard key={tc.name} padding="md" radius="md">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-display-ui text-base font-semibold tracking-[-0.03em]">{tc.name}</p>
                        <SignalPill accent="secondary">{tc.status === "completed" ? copy.completedLabel : copy.pendingLabel}</SignalPill>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-foreground-muted">{tc.detail}</p>
                    </SurfaceCard>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-foreground-muted">{copy.emptyToolCalls}</p>
                )}
              </div>
            </section>

            <section>
              <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">{copy.sourceLabel}</p>
              <div className="mt-3 grid gap-3">
                {latestAssistantMeta?.sources?.length ? (
                  latestAssistantMeta.sources.map((source) => (
                    <SurfaceCard key={`${source.path}-${source.title}`} padding="md" radius="md">
                      <p className="font-display-ui text-base font-semibold tracking-[-0.03em]">{source.title}</p>
                      <p className="mt-3 font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">{source.path}</p>
                    </SurfaceCard>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-foreground-muted">{copy.emptySources}</p>
                )}
              </div>
            </section>
          </div>
        </GlassPanel>
      </aside>

      {/* Messages */}
      <div ref={scrollRef} className="relative mx-auto w-full max-w-[720px] px-4 md:px-6">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <SignalPill accent="secondary">{copy.demoBadge}</SignalPill>
          <SignalPill accent={selectedModel === "gpt-5" ? "primary" : "secondary"}>{activeModel.label}</SignalPill>
          <p className="font-label-ui text-[11px] uppercase tracking-[0.22em] text-foreground-muted">{siteAgent.name} / {activeModel.provider}</p>
        </div>

        <section className="space-y-16">
          {messages.map((message, msgIdx) => {
            if (message.role === "user") {
              return (
                <article
                  className="flex animate-fade-up justify-end"
                  key={message.id}
                  style={{ animationDelay: `${Math.min(msgIdx * 40, 200)}ms` }}
                >
                  <GlassPanel className="max-w-[85%] rounded-[30px] rounded-tr-[12px] border border-white/[0.05] bg-[#1a1a2e]/60 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.25)] [overflow-wrap:anywhere] md:px-6 md:py-4">
                    {message.image && (
                      <div className="mb-3 overflow-hidden rounded-xl">
                        <img src={message.image} alt="" className="max-h-48 rounded-xl" />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-[1rem] leading-relaxed tracking-tight text-foreground">{message.content}</p>
                  </GlassPanel>
                </article>
              );
            }

            return (
              <article
                className="animate-fade-up relative pl-5 md:pl-8 [overflow-wrap:anywhere]"
                key={message.id}
                style={{ animationDelay: `${Math.min(msgIdx * 40, 200)}ms` }}
              >
                <div className="absolute left-0 top-0 h-full w-[2px] rounded-full bg-gradient-to-b from-primary/80 via-primary/40 to-transparent" />

                {message.meta && (
                  <div className="mb-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3 font-label-ui text-[9px] uppercase tracking-[0.2em] text-foreground-muted/40">
                      <div className="h-px w-6 bg-white/[0.10]" />
                      <span>{copy.traceLabel}</span>
                      <div className="h-px flex-1 bg-white/[0.10]" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/15 bg-secondary/5 px-2.5 py-1 text-[10px] text-secondary/80">
                        <span className="pulse-dot"><BoltIcon /></span>
                        {copy.searchingKnowledgeLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-foreground-muted/60">
                        <CheckIcon />
                        {copy.foundSourcesLabel} {message.meta.sources.length}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-foreground-muted/60">
                        <TerminalIcon />
                        {copy.usedToolsLabel} {message.meta.toolCalls.length}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  {message.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMarkdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  ) : null}
                  {message.isStreaming && <span className="streaming-cursor" />}

                  {/* Generative UI action cards */}
                  {message.uiActions && message.uiActions.length > 0 && !message.isStreaming && (
                    <UiActionCards actions={message.uiActions} locale={locale === "zh" ? "zh" : "en"} />
                  )}

                  {/* Inline artifacts — collapsible */}
                  {message.artifacts && message.artifacts.length > 0 && !message.isStreaming && (
                    <CollapsibleArtifacts artifacts={message.artifacts} locale={locale === "zh" ? "zh" : "en"} />
                  )}

                  {/* Inline source citations */}
                  {!message.isStreaming && message.meta?.sources && message.meta.sources.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                      <span className="font-label-ui text-[9px] uppercase tracking-[0.25em] text-foreground-muted/30">
                        {locale === "zh" ? "来源" : "Sources"}
                      </span>
                      {message.meta.sources.map((src, srcIdx) => (
                        <span
                          className="cursor-default rounded-full border border-outline-variant/20 bg-surface-low/50 px-2.5 py-1 font-label-ui text-[10px] text-foreground-muted/50 transition-colors hover:border-primary/20 hover:text-primary/70"
                          key={`${src.path}-${srcIdx}`}
                          title={src.path}
                        >
                          ↗ {src.title.length > 28 ? src.title.slice(0, 28) + "…" : src.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {/* Bottom composer */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent pt-20">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-10 md:px-6">
          {latestPreviewSource && (
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-indigo-950 to-purple-900 shadow-[0_0_15px_rgba(208,188,255,0.2)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(208,188,255,0.2),transparent_60%)]" />
                <div className="relative text-primary">
                  <BarChart3 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">{copy.attachmentPreviewLabel}</p>
                <p className="mt-2 truncate text-sm text-foreground">{latestPreviewSource.title}</p>
              </div>
            </div>
          )}

          <div className="mb-6 flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {conversationSuggestions.map((suggestion) => (
              <button
                className="shrink-0 whitespace-nowrap rounded-full border border-outline-variant/20 bg-surface-low/40 px-4 py-2 text-xs font-medium text-foreground-muted transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                key={suggestion}
                onClick={() => void sendMessage(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="rounded-full border border-primary/10 bg-[#0e0e0e]/60 px-3 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-[40px]">
            {attachedImage && (
              <div className="mb-2 flex items-center gap-2 px-2">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-primary/30">
                  <img src={attachedImage} alt="Attached" className="h-full w-full object-cover" />
                  <button
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-white text-[10px]"
                    onClick={() => setAttachedImage(null)}
                    type="button"
                  >
                    <XIcon className="h-3 w-3" strokeWidth={2} />
                  </button>
                </div>
                <span className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                  {locale === "zh" ? "已附图" : "Image attached"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                  e.target.value = "";
                }}
              />
              <button
                aria-label={locale === "zh" ? "上传图片" : "Upload image"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <PlusIcon />
              </button>
              <div className="mx-1 h-6 w-px bg-outline-variant/20" />
              <button
                className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 transition-colors hover:border-primary/40"
                onClick={() => setSelectedModel((v) => v === "gpt-5" ? "gpt-5-mini" : "gpt-5")}
                title={activeModel.provider}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className={["font-label-ui text-[10px] font-bold uppercase tracking-[0.18em]", modelToneClassNames[selectedModel]].join(" ")}>
                    {activeModel.label}
                  </span>
                </div>
              </button>
              <textarea
                className="min-h-[24px] max-h-28 flex-1 resize-none bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-foreground-muted/50"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                onPaste={handlePaste}
                placeholder={copy.inputPlaceholder}
                aria-label={copy.inputPlaceholder}
                rows={1}
                value={input}
              />
              {isPending ? (
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                  onClick={handleCancel}
                  type="button"
                  title={copy.cancelLabel}
                >
                  <XIcon className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : (
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-background shadow-[0_0_20px_rgba(208,188,255,0.4)] transition-transform hover:scale-105"
                  onClick={() => void sendMessage(input, attachedImage)}
                  type="button"
                >
                  <ArrowUpIcon />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 text-center font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
            {copy.composerHint}
          </div>
        </div>
      </div>
    </main>
  );
}
