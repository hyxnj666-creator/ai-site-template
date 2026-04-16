"use client";

import { type AgentEvent } from "@ai-site/ai";
import { aiPageExperiencesByLocale, type LocalizedValue } from "@ai-site/content";
import {
  FeatureCard,
  GlassPanel,
  SignalBar,
  SignalPill,
  StatusChip,
  accentDotClassNames,
  accentTextClassNames,
  buttonClassName,
  type AccentTone,
} from "@ai-site/ui";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocalizedValue, useSiteLocale } from "../locale-provider";
import {
  AccentEyebrow,
  OutlineHeroWord,
  accentBorderClassNames,
  accentRingClassNames,
  accentSurfaceClassNames,
} from "./shared";
import {
  getHighlighter,
  mapToShikiLang,
  createLineNumberTransformer,
} from "@/lib/shiki";

// ─── Types ───────────────────────────────────────────────────────────────────

type TimelineItemKind = "thought" | "action" | "observation" | "artifact" | "answer";
type TimelineItemStatus = "queued" | "running" | "streaming" | "done";
type ArtifactKind = "html" | "markdown" | "json" | "python";
type ArtifactViewTab = "preview" | "source" | "metadata" | "diff";
type ContentSegment =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language: string };

interface TimelineItem {
  id: string;
  kind: TimelineItemKind;
  title: string;
  content: string;
  status: TimelineItemStatus;
  timestamp: string;
  startedAtMs?: number;
  updatedAtMs?: number;
}

interface ArtifactState {
  id: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  status: "queued" | "running" | "streaming" | "done";
}

interface ArtifactVersion {
  versionId: string;
  runId: number;
  title: string;
  kind: ArtifactKind;
  content: string;
  timestamp: string;
}

interface SourceItem {
  path: string;
  title: string;
}

// ─── I18n ────────────────────────────────────────────────────────────────────

interface PageCopy {
  artifactsLabel: string;
  cancelLabel: string;
  collapseLabel: string;
  connectingLabel: string;
  copiedLabel: string;
  copyLabel: string;
  diffTab: string;
  downloadLabel: string;
  emptyTimeline: string;
  errorMessage: string;
  expandLabel: string;
  finalAnswerTitle: string;
  linesLabel: string;
  metadataTab: string;
  missionEyebrow: string;
  missionBadge: string;
  previewTab: string;
  runningLabel: string;
  sourceTab: string;
  sourcesLabel: string;
}

const pageCopyByLocale: LocalizedValue<PageCopy> = {
  zh: {
    artifactsLabel: "生成产物",
    cancelLabel: "取消",
    collapseLabel: "折叠",
    connectingLabel: "正在连接...",
    copiedLabel: "已复制",
    copyLabel: "复制",
    diffTab: "Diff",
    downloadLabel: "下载",
    emptyTimeline: "Agent 已就绪，等待任务指令。",
    errorMessage: "Agent 运行失败，请稍后重试。",
    expandLabel: "展开",
    finalAnswerTitle: "最终回答",
    linesLabel: "行",
    metadataTab: "元数据",
    missionEyebrow: "任务",
    missionBadge: "就绪",
    previewTab: "预览",
    runningLabel: "Agent 正在执行...",
    sourceTab: "源码",
    sourcesLabel: "引用来源",
  },
  en: {
    artifactsLabel: "Generated Artifacts",
    cancelLabel: "Cancel",
    collapseLabel: "Collapse",
    connectingLabel: "Connecting...",
    copiedLabel: "Copied",
    copyLabel: "Copy",
    diffTab: "Diff",
    downloadLabel: "Download",
    emptyTimeline: "Agent ready. Awaiting mission parameters.",
    errorMessage: "The agent run failed. Please try again.",
    expandLabel: "Expand",
    finalAnswerTitle: "Final Answer",
    linesLabel: "lines",
    metadataTab: "Metadata",
    missionEyebrow: "Mission",
    missionBadge: "Ready",
    previewTab: "Preview",
    runningLabel: "Agent is running...",
    sourceTab: "Source",
    sourcesLabel: "Sources",
  },
} as const;

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const kindAccent: Record<TimelineItemKind, AccentTone> = {
  thought: "primary",
  action: "secondary",
  observation: "tertiary",
  artifact: "secondary",
  answer: "primary",
};

function parseEventMs(ts?: string): number {
  if (!ts) return Date.now();
  return new Date(ts).getTime() || Date.now();
}

function formatEventTime(ts?: string): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDuration(ms: number, locale: string): string {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return locale === "zh" ? `${s}秒` : `${s}s`;
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `00:${secs.toString().padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPhaseLabel(kind: TimelineItemKind, locale: string): string {
  const map: Record<TimelineItemKind, [string, string]> = {
    thought: ["推理", "REASONING"],
    action: ["执行", "EXECUTION"],
    observation: ["观测", "OBSERVATION"],
    artifact: ["产物", "ARTIFACT"],
    answer: ["综合", "SYNTHESIS"],
  };
  return locale === "zh" ? map[kind][0] : map[kind][1];
}

function getToolLabel(tool: string, locale: string): string {
  const map: Record<string, [string, string]> = {
    knowledge_search: ["知识检索", "Knowledge Search"],
    artifact_strategy: ["产物策略", "Artifact Strategy"],
    implementation_checklist: ["执行清单", "Implementation Checklist"],
  };
  return map[tool]?.[locale === "zh" ? 0 : 1] ?? tool;
}

function getObservationTitle(tool: string, locale: string): string {
  const map: Record<string, [string, string]> = {
    knowledge_search: ["知识匹配结果", "Knowledge Matches"],
    artifact_strategy: ["产物策略分析", "Artifact Strategy Analysis"],
    implementation_checklist: ["执行清单生成", "Checklist Generated"],
  };
  return map[tool]?.[locale === "zh" ? 0 : 1] ?? (locale === "zh" ? "工具结果" : "Tool Result");
}

function charProgress(len: number, locale: string): string {
  if (len < 100) return locale === "zh" ? `${len} 字` : `${len} chars`;
  return locale === "zh"
    ? `${(len / 1000).toFixed(1)}k 字`
    : `${(len / 1000).toFixed(1)}k chars`;
}

function getArtifactLabel(kind: ArtifactKind): string {
  if (kind === "html") return "HTML";
  if (kind === "json") return "JSON";
  if (kind === "python") return "Python";
  return "Markdown";
}

function getArtifactDisplayLanguage(artifact: ArtifactState): string {
  const lower = (artifact.title || "").toLowerCase();
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".json")) return "json";
  return artifact.kind;
}

function getArtifactFileName(artifact: ArtifactState): string {
  const slug = artifact.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  const ext = artifact.kind === "html" ? "html" : artifact.kind === "json" ? "json" : artifact.kind === "python" ? "py" : "md";
  return `${slug || artifact.id}.${ext}`;
}

function getLineCount(content: string): number {
  return content ? content.split(/\r?\n/).length : 0;
}

// ─── Content Processing ──────────────────────────────────────────────────────

function cleanArtifactContent(raw: string, kind: string): string {
  let text = raw.trim();
  const fence = /^```[\w-]*\s*\n?([\s\S]*?)```\s*$/;
  const m = text.match(fence);
  if (m) text = m[1].trim();
  if (kind === "html") {
    const docIdx = text.indexOf("<!");
    const htmlIdx = text.indexOf("<html");
    const start = docIdx >= 0 ? docIdx : htmlIdx;
    if (start > 0) text = text.slice(start);
  }
  if (kind === "json") {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s >= 0 && e > s) text = text.slice(s, e + 1);
  }
  return text;
}

function inferLanguage(hint: string | undefined, fallback: string): string {
  const n = (hint || "").toLowerCase();
  if (n.includes("json")) return "json";
  if (n.includes("html")) return "html";
  if (n.includes("python") || n.includes("py")) return "python";
  if (n.includes("md") || n.includes("markdown")) return "markdown";
  if (n.includes("ts") || n.includes("js")) return "typescript";
  if (n.includes("diff")) return "diff";
  return fallback;
}

function splitContentSegments(text: string, fallbackLanguage = "text"): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const regex = /```([\w-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const t = text.slice(lastIndex, match.index);
      if (t.trim()) segments.push({ type: "text", content: t });
    }
    segments.push({
      type: "code",
      content: match[2].replace(/\n$/, ""),
      language: inferLanguage(match[1], "text"),
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    const t = text.slice(lastIndex);
    if (t.trim()) segments.push({ type: "text", content: t });
  }
  if (segments.length === 0 && text) {
    const lang = inferLanguage(fallbackLanguage, "text");
    if (["html", "json", "python", "typescript", "diff"].includes(lang)) {
      segments.push({ type: "code", content: text, language: lang });
    } else {
      segments.push({ type: "text", content: text });
    }
  }
  return segments;
}

function parseObservationContent(content?: string) {
  if (!content) return { pairs: [] as Array<{ key: string; value: string }>, bullets: [] as string[] };
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const pairs: Array<{ key: string; value: string }> = [];
  const bullets: string[] = [];
  for (const line of lines) {
    const pairMatch = line.match(/^[-*]?\s*([^:：]{2,24})[:：]\s*(.+)$/);
    if (pairMatch) {
      pairs.push({ key: pairMatch[1].trim(), value: pairMatch[2].trim() });
      continue;
    }
    bullets.push(line.replace(/^[-*]\s*/, ""));
  }
  return { pairs, bullets };
}

function buildArtifactDiff(previous: string, current: string): string {
  const prevLines = previous.split(/\r?\n/);
  const currentLines = current.split(/\r?\n/);
  const max = Math.max(prevLines.length, currentLines.length);
  const diffLines: string[] = [];
  for (let i = 0; i < max; i++) {
    const prevLine = prevLines[i];
    const currentLine = currentLines[i];
    if (prevLine === currentLine) continue;
    if (typeof prevLine === "string") diffLines.push(`- ${prevLine}`);
    if (typeof currentLine === "string") diffLines.push(`+ ${currentLine}`);
  }
  return diffLines.join("\n");
}

// ─── HTML Iframe Helpers ─────────────────────────────────────────────────────

function injectScrollbarStyles(html: string): string {
  const css = `
html { scrollbar-gutter: stable; }
* { scrollbar-width: thin; scrollbar-color: rgba(208,188,255,0.35) rgba(10,10,20,0.8); }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: rgba(10,10,20,0.8); border-radius: 4px; }
::-webkit-scrollbar-thumb { background: rgba(208,188,255,0.3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(208,188,255,0.5); }
`;
  const tag = `<style>${css}</style>`;
  if (/<head[\s>]/i.test(html)) return html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}${tag}`);
  if (/<html[\s>]/i.test(html)) return html.replace(/<html(\s[^>]*)?>/i, (m) => `${m}<head>${tag}</head>`);
  return `<!doctype html><html><head>${tag}</head><body>${html}</body></html>`;
}

// ─── Regex Tokenizer (fallback when Shiki is loading) ────────────────────────

function tokenizeLine(line: string, language: string) {
  if (language === "diff") {
    if (line.startsWith("+")) return [{ text: line, cls: "text-green-400" }];
    if (line.startsWith("-")) return [{ text: line, cls: "text-red-400" }];
  }
  const regex =
    /(<!--[\s\S]*?-->|\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)|("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`)|(<\/?[A-Za-z][^>]*>)|\b(true|false|null|undefined|None|const|let|var|return|function|if|else|elif|for|while|async|await|class|interface|type|import|from|export|default|new|def|self|try|except|finally|with|as|in|is|not|and|or|print|yield|raise|pass|break|continue|lambda)\b|\b(\d+(?:\.\d+)?)\b|([{}[\](),.:;=])/gm;

  const tokens: Array<{ text: string; cls: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, m.index), cls: "text-foreground-muted" });
    }
    let cls = "text-foreground-muted";
    if (m[1]) cls = "text-foreground-muted/50 italic";
    else if (m[2]) cls = "text-green-300";
    else if (m[3]) cls = "text-primary/80";
    else if (m[4]) cls = "text-primary";
    else if (m[5]) cls = "text-accent";
    else if (m[6]) cls = "text-foreground-muted/60";
    tokens.push({ text: m[0], cls });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), cls: "text-foreground-muted" });
  }
  return tokens.length > 0 ? tokens : [{ text: line || " ", cls: "text-foreground-muted" }];
}

// ─── Shiki-based Highlighted Code Block (ported from resume) ─────────────────

function HighlightedCodeBlock(props: {
  code: string;
  language: string;
  maxHeight?: string;
  collapsible?: boolean;
  wrapLongLines?: boolean;
  labels?: { expand: string; collapse: string; lines: string };
}) {
  const {
    code,
    language,
    maxHeight = "max-h-[520px]",
    collapsible = true,
    wrapLongLines = false,
    labels,
  } = props;
  const expandLabel = labels?.expand ?? "Expand";
  const collapseLabel = labels?.collapse ?? "Collapse";
  const linesLabel = labels?.lines ?? "lines";
  const [expanded, setExpanded] = useState(false);
  const [shikiHtml, setShikiHtml] = useState<string | null>(null);
  const lines = code.split(/\r?\n/);
  const canCollapse = collapsible && lines.length > 18;
  const shouldWrap = wrapLongLines || language === "markdown";
  const gutterWidth = String(lines.length).length;

  useEffect(() => {
    setShikiHtml(null);
    let cancelled = false;
    getHighlighter()
      .then((h) => {
        const html = h.codeToHtml(code, {
          lang: mapToShikiLang(language),
          theme: "github-dark",
          transformers: [createLineNumberTransformer()],
        });
        if (!cancelled) setShikiHtml(html);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [code, language]);

  const shikiBlock = shikiHtml != null ? (
    <div
      className={[
        "shiki-code-block min-w-0 px-0 py-2",
        shouldWrap ? "overflow-x-hidden whitespace-pre-wrap break-words" : "overflow-x-auto overflow-y-hidden",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: shikiHtml }}
    />
  ) : (
    <pre
      className={[
        "min-w-0 px-0 py-2 text-[12px] leading-6 text-foreground-muted",
        shouldWrap ? "overflow-x-hidden whitespace-pre-wrap break-words" : "overflow-x-auto overflow-y-hidden",
      ].join(" ")}
    >
      {lines.map((line, i) => (
        <div key={`line-${i}`} className="flex hover:bg-white/[0.03]">
          <span
            className="select-none px-3 text-right text-foreground-muted/25"
            style={{ minWidth: `${gutterWidth + 2}ch` }}
          >
            {i + 1}
          </span>
          <span className={["min-w-0 flex-1 px-2", shouldWrap ? "whitespace-pre-wrap break-words" : ""].join(" ")}>
            {tokenizeLine(line, language).map((tok, ti) => (
              <span key={`t-${i}-${ti}`} className={tok.cls}>{tok.text}</span>
            ))}
          </span>
        </div>
      ))}
    </pre>
  );

  return (
    <div className="relative min-w-0 rounded-lg border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="font-label-ui text-[10px] uppercase tracking-[0.14em] text-foreground-muted/50">
          {language}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-label-ui text-[10px] text-foreground-muted/30">
            {lines.length} {linesLabel}
          </span>
          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="font-label-ui text-[10px] uppercase tracking-[0.12em] text-foreground-muted/50 transition-colors hover:text-foreground-muted"
              aria-expanded={expanded}
            >
              {expanded ? collapseLabel : expandLabel}
            </button>
          )}
        </div>
      </div>
      <div
        className={[
          canCollapse && !expanded ? `${maxHeight} overflow-hidden` : "",
          "overflow-auto",
        ].join(" ")}
        style={{ scrollbarWidth: "thin" }}
      >
        {shikiBlock}
      </div>
      {canCollapse && !expanded && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
      )}
    </div>
  );
}

// ─── Expandable Text Panel ───────────────────────────────────────────────────

function ExpandableTextPanel(props: {
  children: ReactNode;
  canCollapse: boolean;
  maxHeight?: string;
  labels?: { expand: string; collapse: string };
}) {
  const { children, canCollapse, maxHeight = "max-h-[280px]", labels } = props;
  const [expanded, setExpanded] = useState(false);
  const expandLabel = labels?.expand ?? "Expand";
  const collapseLabel = labels?.collapse ?? "Collapse";

  return (
    <div className="relative rounded-lg border border-white/10 bg-white/[0.02]">
      {canCollapse && (
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="font-label-ui text-[10px] text-foreground-muted/50 transition-colors hover:text-foreground-muted"
            aria-expanded={expanded}
          >
            {expanded ? collapseLabel : expandLabel}
          </button>
        </div>
      )}
      <div className={["p-4", canCollapse && !expanded ? `${maxHeight} overflow-hidden` : ""].join(" ")}>
        {children}
      </div>
      {canCollapse && !expanded && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-high to-transparent" />
      )}
    </div>
  );
}

// ─── Markdown Prose Renderer ──────────────────────────────────────────────────

const markdownComponents: Record<string, React.ComponentType<Record<string, unknown>>> = {
  h1: (p) => <h1 className="mb-3 mt-6 text-xl font-semibold text-foreground-muted" {...p} />,
  h2: (p) => <h2 className="mb-2 mt-5 text-lg font-semibold text-foreground-muted" {...p} />,
  h3: (p) => <h3 className="mb-2 mt-4 text-base font-semibold text-foreground-muted" {...p} />,
  h4: (p) => <h4 className="mb-1 mt-3 text-sm font-semibold text-foreground-muted" {...p} />,
  p: (p) => <p className="mb-3 text-sm leading-7 text-foreground-muted/90" {...p} />,
  ul: (p) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-7 text-foreground-muted/90" {...p} />,
  ol: (p) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm leading-7 text-foreground-muted/90" {...p} />,
  li: (p) => <li className="text-sm leading-7" {...p} />,
  blockquote: (p) => <blockquote className="my-3 border-l-2 border-primary/30 pl-4 italic text-foreground-muted/70" {...p} />,
  strong: (p) => <strong className="font-semibold text-foreground-muted" {...p} />,
  em: (p) => <em className="italic text-foreground-muted/80" {...p} />,
  a: (p) => <a className="text-primary underline decoration-primary/30 hover:decoration-primary/60" target="_blank" rel="noopener noreferrer" {...p} />,
  hr: () => <hr className="my-4 border-white/10" />,
  table: (p) => <div className="my-3 overflow-x-auto"><table className="w-full text-sm" {...p} /></div>,
  th: (p) => <th className="border border-white/10 bg-white/5 px-3 py-2 text-left font-semibold text-foreground-muted" {...p} />,
  td: (p) => <td className="border border-white/10 px-3 py-2 text-foreground-muted/80" {...p} />,
  code: ({ className, children, ...rest }: { className?: string; children?: React.ReactNode;[k: string]: unknown }) => {
    const match = /language-(\w+)/.exec(className || "");
    if (match) {
      return <HighlightedCodeBlock code={String(children).replace(/\n$/, "")} language={match[1]} maxHeight="max-h-[400px]" />;
    }
    return <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-primary/90" {...rest}>{children}</code>;
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}

// ─── Rich Content Renderer (for markdown & final answer) ─────────────────────

function RichContentRenderer(props: {
  content: string;
  fallbackLanguage?: string;
}) {
  const { content, fallbackLanguage = "text" } = props;
  const segments = splitContentSegments(content, fallbackLanguage);
  const hasOnlyCode = segments.every((s) => s.type === "code");

  if (!hasOnlyCode) {
    return <MarkdownBlock content={content} />;
  }

  return (
    <div className="space-y-3">
      {segments.map((seg, i) => (
        <HighlightedCodeBlock
          key={`seg-${i}`}
          code={seg.content}
          language={seg.language}
          wrapLongLines={seg.language === "markdown"}
          maxHeight="max-h-[400px]"
        />
      ))}
    </div>
  );
}

// ─── Artifact Preview Renderer ───────────────────────────────────────────────

function ArtifactSkeleton() {
  return (
    <div className="flex min-h-[520px] flex-col gap-4 rounded-b-[18px] bg-white p-6">
      <div className="h-8 w-1/3 animate-pulse rounded-md bg-slate-200" />
      <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-md bg-slate-100" />
      <div className="h-10 w-3/4 animate-pulse rounded-md bg-slate-100" />
    </div>
  );
}

function GeneratingPlaceholder({ locale, done }: { locale: string; done?: boolean }) {
  return (
    <div className="flex h-[520px] items-center justify-center bg-black/20">
      <div className="flex flex-col items-center gap-3">
        {done ? (
          <span className="text-sm text-foreground-muted/40">
            {locale === "zh" ? "内容为空" : "Content is empty"}
          </span>
        ) : (
          <>
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
            <span className="text-sm text-foreground-muted/40">
              {locale === "zh" ? "正在生成..." : "Generating..."}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function renderArtifactPreview(artifact: ArtifactState, locale: string) {
  const cleaned = cleanArtifactContent(artifact.content, artifact.kind);
  const isDone = artifact.status === "done";

  if (artifact.kind === "html") {
    if (!cleaned) return isDone ? <GeneratingPlaceholder locale={locale} done /> : <ArtifactSkeleton />;
    return (
      <div className="overflow-hidden rounded-b-[18px] bg-white">
        <iframe
          srcDoc={injectScrollbarStyles(cleaned)}
          className="h-[520px] w-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title={artifact.title}
        />
      </div>
    );
  }

  if (artifact.kind === "json") {
    if (!cleaned) return <GeneratingPlaceholder locale={locale} done={isDone} />;
    let formatted = cleaned;
    try { formatted = JSON.stringify(JSON.parse(cleaned), null, 2); } catch { /* raw */ }
    return <HighlightedCodeBlock code={formatted} language="json" />;
  }

  if (artifact.kind === "python") {
    if (!cleaned) return <GeneratingPlaceholder locale={locale} done={isDone} />;
    return <HighlightedCodeBlock code={cleaned} language="python" />;
  }

  if (!cleaned) return <GeneratingPlaceholder locale={locale} done={isDone} />;
  return (
    <div className="max-h-[520px] overflow-auto bg-black/20 p-6" style={{ scrollbarWidth: "thin" }}>
      <MarkdownBlock content={cleaned} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AgentMissionControlPage() {
  const content = useLocalizedValue(aiPageExperiencesByLocale).agent;
  const copy = useLocalizedValue(pageCopyByLocale);
  const { locale } = useSiteLocale();
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const selectedModel = "gpt-5";
  const [hasRun, setHasRun] = useState(false);

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const [artifacts, setArtifacts] = useState<ArtifactState[]>([]);
  const [artifactVersionMap, setArtifactVersionMap] = useState<Record<string, ArtifactVersion[]>>({});
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifactView, setArtifactView] = useState<ArtifactViewTab>("preview");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [selectedHistoryVersionId, setSelectedHistoryVersionId] = useState<string | null>(null);

  const [finalAnswer, setFinalAnswer] = useState("");
  const finalAnswerRef = useRef("");

  const [sources, setSources] = useState<SourceItem[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [mode, setMode] = useState<"fallback" | "live" | null>(null);
  const [toolCount, setToolCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activePhase, setActivePhase] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const eventQueueRef = useRef<AgentEvent[]>([]);
  const processingRef = useRef(false);
  const runIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const toolCountRef = useRef(0);
  const latestToolIdRef = useRef<string | null>(null);

  const activeArtifact = useMemo(
    () => artifacts.find((a) => a.id === activeArtifactId) ?? artifacts[artifacts.length - 1] ?? null,
    [activeArtifactId, artifacts],
  );

  const activeArtifactVersions = useMemo(
    () => (activeArtifact ? artifactVersionMap[activeArtifact.id] ?? [] : []),
    [activeArtifact, artifactVersionMap],
  );

  const selectedHistoryVersion = useMemo(
    () =>
      selectedHistoryVersionId
        ? activeArtifactVersions.find((v) => v.versionId === selectedHistoryVersionId) ?? null
        : activeArtifactVersions.length >= 2
          ? activeArtifactVersions[activeArtifactVersions.length - 2]
          : null,
    [activeArtifactVersions, selectedHistoryVersionId],
  );

  const activeArtifactDiff = useMemo(() => {
    if (activeArtifactVersions.length < 2 || !selectedHistoryVersion) return "";
    const latestVersion = activeArtifactVersions[activeArtifactVersions.length - 1];
    return buildArtifactDiff(selectedHistoryVersion.content, latestVersion.content);
  }, [activeArtifactVersions, selectedHistoryVersion]);

  const activeArtifactMetadata = useMemo(() => {
    if (!activeArtifact) return null;
    const versions = artifactVersionMap[activeArtifact.id] ?? [];
    let parsedJson: Record<string, unknown> | null = null;
    if (activeArtifact.kind === "json") {
      try { parsedJson = JSON.parse(cleanArtifactContent(activeArtifact.content, "json")) as Record<string, unknown>; } catch { /* skip */ }
    }
    return {
      id: activeArtifact.id,
      kind: getArtifactLabel(activeArtifact.kind),
      status: activeArtifact.status,
      fileName: getArtifactFileName(activeArtifact),
      chars: activeArtifact.content.length,
      lines: getLineCount(activeArtifact.content),
      hasPreview: activeArtifact.kind === "html",
      jsonKeys: parsedJson ? Object.keys(parsedJson) : [],
      versions: versions.length,
      latestVersion: versions[versions.length - 1] ?? null,
    };
  }, [activeArtifact, artifactVersionMap]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setElapsedMs(Date.now() - startedAtRef.current);
  }, []);

  const upsertItem = useCallback((id: string, patch: Partial<TimelineItem>) => {
    setTimeline((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx === -1) {
        return [...prev, {
          id,
          kind: "thought" as TimelineItemKind,
          title: "",
          content: "",
          status: "running" as TimelineItemStatus,
          timestamp: "",
          ...patch,
        }];
      }
      const c = [...prev];
      c[idx] = { ...c[idx], ...patch };
      return c;
    });
  }, []);

  const scrollTimeline = useCallback(() => {
    const el = listRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    }
  }, []);

  const applyEvent = useCallback(
    async (event: AgentEvent) => {
      const ms = parseEventMs(event.ts);
      const ts = formatEventTime(event.ts);

      switch (event.type) {
        case "step_started": {
          setActivePhase(event.stepId);
          upsertItem(`step:${event.stepId}`, { kind: "thought", title: event.title, status: "queued", timestamp: ts, startedAtMs: ms, updatedAtMs: ms });
          scrollTimeline();
          await sleep(100);
          upsertItem(`step:${event.stepId}`, { status: "running", updatedAtMs: ms });
          scrollTimeline();
          await sleep(180);
          break;
        }
        case "thought_progress": {
          upsertItem(`step:${event.stepId}`, { kind: "thought", title: event.title, content: event.content, status: "streaming", timestamp: ts, updatedAtMs: ms });
          scrollTimeline();
          await sleep(100);
          break;
        }
        case "step_completed": {
          upsertItem(`step:${event.stepId}`, { kind: "thought", title: event.title, content: event.content || "", status: "done", timestamp: ts, updatedAtMs: ms });
          scrollTimeline();
          await sleep(200);
          break;
        }
        case "tool_called": {
          const toolIdx = toolCountRef.current;
          toolCountRef.current += 1;
          setToolCount(toolCountRef.current);
          const toolId = `tool:${event.tool}:${toolIdx}`;
          latestToolIdRef.current = toolId;
          upsertItem(toolId, { kind: "action", title: getToolLabel(event.tool, locale), content: event.input || "", status: "queued", timestamp: ts, startedAtMs: ms, updatedAtMs: ms });
          scrollTimeline();
          await sleep(60);
          upsertItem(toolId, { status: "running", updatedAtMs: ms });
          scrollTimeline();
          await sleep(180);
          break;
        }
        case "tool_result": {
          const toolId = latestToolIdRef.current || `tool:${event.tool}:0`;
          const obsId = toolId.replace("tool:", "observation:");
          upsertItem(obsId, { kind: "observation", title: getObservationTitle(event.tool, locale), content: event.output || "", status: "done", timestamp: ts, startedAtMs: ms, updatedAtMs: ms });
          setCollapsedIds((prev) => prev.includes(obsId) ? prev : [...prev, obsId]);
          upsertItem(toolId, { status: "done", updatedAtMs: ms });
          scrollTimeline();
          await sleep(200);
          break;
        }
        case "artifact_started": {
          setArtifacts((prev) => [...prev.filter((a) => a.id !== event.artifactId), { id: event.artifactId, kind: event.kind, title: event.title, content: "", status: "queued" }]);
          setActiveArtifactId(event.artifactId);
          upsertItem(`artifact:${event.artifactId}`, { kind: "artifact", title: event.title, content: `${event.kind.toUpperCase()}`, status: "queued", timestamp: ts, startedAtMs: ms, updatedAtMs: ms });
          scrollTimeline();
          await sleep(60);
          setArtifacts((prev) => prev.map((a) => a.id === event.artifactId ? { ...a, status: "running" } : a));
          upsertItem(`artifact:${event.artifactId}`, { status: "running", updatedAtMs: ms });
          scrollTimeline();
          await sleep(180);
          break;
        }
        case "artifact_chunk": {
          setArtifacts((prev) => prev.map((a) => a.id === event.artifactId ? { ...a, content: a.content + event.content, status: "streaming" } : a));
          upsertItem(`artifact:${event.artifactId}`, { content: locale === "zh" ? "正在生成..." : "Generating...", status: "streaming", updatedAtMs: ms });
          scrollTimeline();
          break;
        }
        case "artifact_completed": {
          setArtifacts((prev) => prev.map((a) => a.id === event.artifactId ? { ...a, kind: event.kind, title: event.title, content: event.content, status: "done" } : a));
          setArtifactVersionMap((prev) => ({
            ...prev,
            [event.artifactId]: [
              ...(prev[event.artifactId] ?? []),
              { versionId: `${event.artifactId}-${runIdRef.current}-${Date.now()}`, runId: runIdRef.current, title: event.title, kind: event.kind, content: event.content, timestamp: formatEventTime(event.ts) },
            ],
          }));
          setActiveArtifactId(event.artifactId);
          const kindLabels: Record<string, [string, string]> = {
            html: ["HTML 原型就绪", "HTML prototype ready"],
            markdown: ["Markdown 文档就绪", "Markdown document ready"],
            json: ["JSON 摘要就绪", "JSON summary ready"],
            python: ["Python 脚本就绪", "Python script ready"],
          };
          const readyLabel = kindLabels[event.kind]?.[locale === "zh" ? 0 : 1] ?? (locale === "zh" ? "产物就绪" : "Artifact ready");
          upsertItem(`artifact:${event.artifactId}`, { title: event.title, content: readyLabel, status: "done", updatedAtMs: ms });
          setCollapsedIds((prev) => prev.includes(`artifact:${event.artifactId}`) ? prev : [...prev, `artifact:${event.artifactId}`]);
          scrollTimeline();
          await sleep(200);
          break;
        }
        case "final_answer_chunk": {
          finalAnswerRef.current += event.content;
          setFinalAnswer(finalAnswerRef.current);
          upsertItem("answer:final", { kind: "answer", title: locale === "zh" ? "综合回答" : "Synthesizing Answer", content: `${locale === "zh" ? "正在输出" : "Streaming"} ${charProgress(finalAnswerRef.current.length, locale)}`, status: "streaming", timestamp: ts, updatedAtMs: ms });
          scrollTimeline();
          break;
        }
        case "done": {
          setIsRunning(false);
          stopTimer();
          setActivePhase(null);
          setProvider(event.provider ?? null);
          setMode(event.mode ?? null);
          setSources(Array.isArray(event.sources) ? (event.sources as SourceItem[]) : []);
          if (finalAnswerRef.current) {
            upsertItem("answer:final", { title: locale === "zh" ? "回答完成" : "Answer Complete", content: charProgress(finalAnswerRef.current.length, locale), status: "done", updatedAtMs: ms });
          }
          scrollTimeline();
          break;
        }
        case "error": {
          setRunError(event.error);
          setIsRunning(false);
          stopTimer();
          break;
        }
      }
    },
    [locale, scrollTimeline, stopTimer, upsertItem],
  );

  const flushQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    while (eventQueueRef.current.length > 0) {
      const next = eventQueueRef.current.shift();
      if (next) await applyEvent(next);
    }
    processingRef.current = false;
  }, [applyEvent]);

  const handleTimelineScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);

  const handleRun = useCallback(
    async (promptOverride?: string) => {
      if (isRunning) return;
      const prompt = promptOverride || promptRef.current?.value.trim() || content.hero.inputPlaceholder;
      if (!prompt) return;
      if (promptRef.current && promptOverride) promptRef.current.value = promptOverride;

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      runIdRef.current += 1;
      setIsRunning(true);
      setRunError(null);
      setHasRun(true);
      setTimeline([]);
      setFinalAnswer("");
      finalAnswerRef.current = "";
      setArtifacts([]);
      setActiveArtifactId(null);
      setArtifactView("preview");
      setSources([]);
      setProvider(null);
      setMode(null);
      setToolCount(0);
      setElapsedMs(0);
      setActivePhase(null);
      setCollapsedIds([]);
      setCopiedId(null);
      setFullscreenOpen(false);
      setSelectedHistoryVersionId(null);
      eventQueueRef.current = [];
      processingRef.current = false;
      stickToBottomRef.current = true;
      toolCountRef.current = 0;
      latestToolIdRef.current = null;
      startTimer();

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, model: selectedModel, prompt }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`Agent request failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try { eventQueueRef.current.push(JSON.parse(trimmed) as AgentEvent); } catch { /* skip */ }
          }
          await flushQueue();
        }
        if (buffer.trim()) {
          try { eventQueueRef.current.push(JSON.parse(buffer.trim()) as AgentEvent); await flushQueue(); } catch { /* skip */ }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // User cancelled — not an error
        } else {
          console.error(error);
          setRunError(error instanceof Error ? error.message : copy.errorMessage);
        }
      } finally {
        abortRef.current = null;
        setIsRunning(false);
        stopTimer();
      }
    },
    [content.hero.inputPlaceholder, copy.errorMessage, flushQueue, isRunning, locale, startTimer, stopTimer],
  );

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const handleCopy = useCallback((id: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleDownload = useCallback((art: ArtifactState) => {
    const ext = art.kind === "html" ? "html" : art.kind === "json" ? "json" : art.kind === "python" ? "py" : "md";
    const cleaned = cleanArtifactContent(art.content, art.kind);
    const blob = new Blob([cleaned], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${art.title.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  // ── Phase progress (Agent State HUD) ──

  const phaseProgress = useMemo(() => {
    if (!hasRun) {
      return {
        plan: content.state.phases[0]?.progress ?? 100,
        execute: content.state.phases[1]?.progress ?? 72,
        reflect: content.state.phases[2]?.progress ?? 18,
      };
    }
    const analysisDone = timeline.some((t) => t.id === "step:analysis" && t.status === "done");
    const executionDone = timeline.some((t) => t.id === "step:execution" && t.status === "done");
    const finalDone = timeline.some((t) => t.id === "step:final" && t.status === "done") || timeline.some((t) => t.id === "answer:final" && t.status === "done");
    return {
      plan: analysisDone ? 100 : activePhase === "analysis" ? 60 : 10,
      execute: executionDone ? 100 : activePhase === "execution" || activePhase === "artifact" ? 60 : analysisDone ? 10 : 0,
      reflect: finalDone ? 100 : activePhase === "final" ? 60 : executionDone ? 10 : 0,
    };
  }, [activePhase, content.state.phases, hasRun, timeline]);

  const phaseLabels = useMemo(() => {
    if (!hasRun) {
      return {
        plan: content.state.phases[0]?.stateLabel ?? "DONE",
        execute: content.state.phases[1]?.stateLabel ?? "LIVE",
        reflect: content.state.phases[2]?.stateLabel ?? "QUEUED",
      };
    }
    const analysisDone = timeline.some((t) => t.id === "step:analysis" && t.status === "done");
    const executionDone = timeline.some((t) => t.id === "step:execution" && t.status === "done");
    const finalDone = timeline.some((t) => t.id === "step:final" && t.status === "done") || timeline.some((t) => t.id === "answer:final" && t.status === "done");
    const done = locale === "zh" ? "完成" : "DONE";
    const live = locale === "zh" ? "执行中" : "LIVE";
    const queued = locale === "zh" ? "等待" : "QUEUED";
    return {
      plan: analysisDone ? done : activePhase === "analysis" ? live : queued,
      execute: executionDone ? done : activePhase === "execution" || activePhase === "artifact" ? live : queued,
      reflect: finalDone ? done : activePhase === "final" ? live : queued,
    };
  }, [activePhase, content.state.phases, hasRun, locale, timeline]);

  const statusLabel = runError ? runError : isRunning ? copy.runningLabel : mode ? `${provider ?? "agent"} · ${mode}` : content.hero.helperText;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="relative overflow-hidden px-6 pb-24 pt-10 md:px-10">
      <div className="pointer-events-none absolute left-1/2 top-8 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[8%] top-[34%] h-64 w-64 rounded-full bg-secondary/10 blur-[100px]" />

      {/* ── Hero ── */}
      <section className="relative mb-24 text-center">
        <OutlineHeroWord className="mx-auto text-[clamp(5.5rem,18vw,12.5rem)]" word={content.hero.outlineWord} />
        <p className="font-display-ui mt-4 text-2xl font-light tracking-[0.08em] text-foreground-muted md:text-3xl">
          {content.hero.subtitle}
        </p>
        <div className="mx-auto mt-14 max-w-3xl">
          <GlassPanel className="rounded-[28px] p-1 transition-all focus-within:shadow-[0_0_40px_rgba(208,188,255,0.15)]">
            <textarea
              ref={promptRef}
              className="min-h-[120px] w-full resize-none bg-transparent px-6 py-6 text-lg outline-none placeholder:text-foreground-muted/40"
              placeholder={content.hero.inputPlaceholder}
              aria-label={content.hero.inputPlaceholder}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isRunning) {
                  e.preventDefault();
                  void handleRun();
                }
              }}
            />
            <div className="flex flex-col gap-4 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-left text-sm text-foreground-muted">
                {isRunning && timeline.length === 0 ? copy.connectingLabel : statusLabel}
              </p>
              <div className="flex items-center gap-3">
                {isRunning ? (
                  <button
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 font-label-ui text-[11px] uppercase tracking-[0.12em] text-red-400 transition-colors hover:bg-red-500/20"
                    onClick={handleCancel}
                    type="button"
                  >
                    {copy.cancelLabel}
                  </button>
                ) : (
                  <button
                    className={buttonClassName()}
                    onClick={() => void handleRun()}
                    type="button"
                  >
                    {content.hero.ctaLabel}
                  </button>
                )}
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* ── Main Grid: Timeline (6) + Agent State (4) ── */}
      <div className="grid gap-12 lg:grid-cols-10">
        {/* LEFT: Dynamic Timeline */}
        <section className="relative lg:col-span-6">
          <div
            ref={listRef}
            onScroll={handleTimelineScroll}
            className="relative max-h-[700px] overflow-y-auto pr-2 lg:max-h-[840px]"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(208,188,255,0.15) transparent" }}
          >
            {timeline.length === 0 ? (
              <GlassPanel className="rounded-[20px] p-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                  <span className="h-3 w-3 rounded-full bg-primary/40" />
                </div>
                <p className="text-sm text-foreground-muted/60">{copy.emptyTimeline}</p>
              </GlassPanel>
            ) : (
              <div className="space-y-3">
                {timeline.map((item, index) => {
                  const accent = kindAccent[item.kind];
                  const isActive = item.status === "running" || item.status === "streaming";
                  const collapsed = collapsedIds.includes(item.id);
                  const canCollapse = (item.kind === "observation" || item.kind === "artifact") && Boolean(item.content);
                  const elapsed = item.startedAtMs && item.updatedAtMs ? item.updatedAtMs - item.startedAtMs : undefined;
                  const observationData = item.kind === "observation" ? parseObservationContent(item.content) : null;
                  const observationToolKey = item.kind === "observation" && item.id.startsWith("observation:") ? item.id.replace("observation:", "") : null;

                  return (
                    <div key={item.id} className="relative pl-8">
                      {index < timeline.length - 1 && (
                        <div className="absolute bottom-[-12px] left-[11px] top-8 w-px bg-white/[0.06]" />
                      )}
                      <div
                        className={[
                          "absolute left-0 top-4 flex h-6 w-6 items-center justify-center rounded-full border bg-surface-high",
                          isActive ? accentBorderClassNames[accent] : item.status === "done" ? accentBorderClassNames[accent] : "border-white/10",
                        ].join(" ")}
                      >
                        {isActive ? (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className={["absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", accentDotClassNames[accent]].join(" ")} />
                            <span className={["relative inline-flex h-2.5 w-2.5 rounded-full", accentDotClassNames[accent]].join(" ")} />
                          </span>
                        ) : (
                          <span className={["h-2 w-2 rounded-full", item.status === "done" ? accentDotClassNames[accent] : "bg-foreground-muted/20"].join(" ")} />
                        )}
                      </div>

                      <GlassPanel
                        className={[
                          "rounded-[16px] p-4 transition-all",
                          isActive
                            ? accent === "primary" ? "border-l-2 border-l-primary/40"
                              : accent === "secondary" ? "border-l-2 border-l-secondary/40"
                                : "border-l-2 border-l-tertiary/40"
                            : "",
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={["rounded-full px-2 py-0.5 font-label-ui text-[10px] uppercase tracking-[0.14em]", accentSurfaceClassNames[accent], accentTextClassNames[accent]].join(" ")}>
                              {getPhaseLabel(item.kind, locale)}
                            </span>
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            {isActive && (
                              <span className="inline-flex items-center gap-0.5">
                                {[0, 150, 300].map((delay) => (
                                  <span key={delay} className={["h-1 w-1 animate-pulse rounded-full", accentDotClassNames[accent]].join(" ")} style={{ animationDelay: `${delay}ms` }} />
                                ))}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {item.timestamp && <span className="font-label-ui text-[10px] text-foreground-muted/40">{item.timestamp}</span>}
                            {elapsed != null && elapsed > 0 && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-label-ui text-[10px] text-foreground-muted">{formatDuration(elapsed, locale)}</span>
                            )}
                            {canCollapse && (
                              <button type="button" onClick={() => toggleCollapsed(item.id)} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-label-ui text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:bg-white/10">
                                {collapsed ? copy.expandLabel : copy.collapseLabel}
                              </button>
                            )}
                            <span className={["rounded-full px-2 py-0.5 font-label-ui text-[10px]", item.status === "queued" ? "bg-white/5 text-foreground-muted/50" : isActive ? `${accentSurfaceClassNames[accent]} ${accentTextClassNames[accent]}` : "bg-white/5 text-foreground-muted"].join(" ")}>
                              {item.status === "queued" ? (locale === "zh" ? "排队" : "QUEUED") : item.status === "streaming" ? (locale === "zh" ? "流式" : "STREAM") : isActive ? (locale === "zh" ? "执行" : "LIVE") : (locale === "zh" ? "完成" : "DONE")}
                            </span>
                          </div>
                        </div>

                        {/* Observation-specific rendering */}
                        {item.kind === "observation" && item.content && !collapsed && observationData && (
                          <div className="mt-3 space-y-2">
                            {observationToolKey === "knowledge_search" && (
                              <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                                <p className="mb-2 font-label-ui text-[10px] uppercase tracking-[0.14em] text-primary/70">
                                  {locale === "zh" ? "匹配结果" : "Matched context"}
                                </p>
                                <div className="space-y-1.5">
                                  {[...observationData.bullets, ...observationData.pairs.map((p) => `${p.key}: ${p.value}`)].map((b, bi) => (
                                    <div key={`match-${bi}`} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-xs text-foreground-muted/80 whitespace-pre-wrap">{b}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {observationToolKey === "artifact_strategy" && (
                              <div className="space-y-2">
                                {observationData.pairs.length > 0 && (
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    {observationData.pairs.map((pair, pi) => (
                                      <div key={`pair-${pi}`} className="rounded-lg border border-secondary/10 bg-secondary/5 p-3">
                                        <p className="font-label-ui text-[10px] uppercase tracking-[0.14em] text-secondary/70">{pair.key}</p>
                                        <p className="mt-1.5 text-xs text-foreground-muted/80 whitespace-pre-wrap">{pair.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {observationData.bullets.length > 0 && (
                                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                    <p className="mb-2 font-label-ui text-[10px] uppercase tracking-[0.14em] text-foreground-muted/40">
                                      {locale === "zh" ? "策略要点" : "Strategy notes"}
                                    </p>
                                    <div className="space-y-1.5">
                                      {observationData.bullets.map((b, bi) => (
                                        <div key={`bullet-${bi}`} className="flex items-start gap-2 text-xs text-foreground-muted/70">
                                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary/60" />
                                          <span className="whitespace-pre-wrap">{b}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {observationToolKey === "implementation_checklist" && (
                              <div className="rounded-lg border border-tertiary/10 bg-tertiary/5 p-3">
                                <p className="mb-2 font-label-ui text-[10px] uppercase tracking-[0.14em] text-tertiary/70">
                                  {locale === "zh" ? "执行清单" : "Execution checklist"}
                                </p>
                                <div className="space-y-1.5">
                                  {[...observationData.bullets, ...observationData.pairs.map((p) => `${p.key}: ${p.value}`)].map((b, bi) => (
                                    <div key={`check-${bi}`} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tertiary/15 px-1 font-label-ui text-[10px] text-tertiary">{bi + 1}</span>
                                      <span className="pt-0.5 text-xs text-foreground-muted/80 whitespace-pre-wrap">{b}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!observationToolKey && (
                              <div className="max-h-[200px] overflow-y-auto rounded-xl bg-white/[0.03] p-3 text-xs leading-6 text-foreground-muted/80" style={{ scrollbarWidth: "thin" }}>
                                <pre className="whitespace-pre-wrap break-words font-sans">{item.content}</pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Generic content body (non-observation) */}
                        {item.kind !== "observation" && item.content && !collapsed && (
                          <div className={["mt-3 rounded-xl p-3 text-xs leading-6", isActive ? "bg-white/[0.03] text-foreground-muted" : "bg-white/[0.02] text-foreground-muted/80"].join(" ")}>
                            <pre className="whitespace-pre-wrap break-words font-sans">{item.content}</pre>
                          </div>
                        )}
                      </GlassPanel>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Agent State HUD */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28 lg:h-fit">
          <GlassPanel className="rounded-[28px] p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display-ui text-xl font-semibold tracking-[-0.03em]">{content.state.title}</h2>
              <StatusChip tone={isRunning ? "secondary" : mode === "live" ? "secondary" : "primary"} pulse={isRunning}>
                {isRunning ? (locale === "zh" ? "运行中" : "Active") : mode === "live" ? (locale === "zh" ? "在线" : "Live") : mode === "fallback" ? (locale === "zh" ? "回退" : "Fallback") : content.state.statusValue}
              </StatusChip>
            </div>
            <div className="mt-10 grid gap-5">
              <SignalBar accent="primary" label={locale === "zh" ? "规划" : "PLAN"} value={phaseProgress.plan} valueLabel={phaseLabels.plan} />
              <SignalBar accent="secondary" label={locale === "zh" ? "执行" : "EXECUTE"} value={phaseProgress.execute} valueLabel={phaseLabels.execute} />
              <SignalBar accent="tertiary" label={locale === "zh" ? "反思" : "REFLECT"} value={phaseProgress.reflect} valueLabel={phaseLabels.reflect} />
            </div>
            <div className="mt-10">
              <p className="font-label-ui text-[10px] uppercase tracking-[0.24em] text-foreground-muted">{content.state.capabilitiesLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.state.capabilities.map((cap) => (
                  <SignalPill accent={cap.accent} key={cap.label}>{cap.label}</SignalPill>
                ))}
              </div>
            </div>
            <div className="mt-10 grid gap-5">
              <SignalBar accent="primary" label={locale === "zh" ? "记忆窗口" : "Memory Window"} value={hasRun ? Math.min(96, 10 + toolCount * 15) : content.state.metrics[0]?.progress ?? 10} valueLabel={hasRun ? `${(8.4 + toolCount * 2.1).toFixed(1)}k / 128k` : content.state.metrics[0]?.valueLabel ?? "12.4k / 128k"} />
              <SignalBar accent="secondary" label={locale === "zh" ? "工具调用" : "Tool Calls"} value={hasRun ? Math.min(100, toolCount * 25) : content.state.metrics[1]?.progress ?? 64} valueLabel={hasRun ? `${toolCount}` : content.state.metrics[1]?.valueLabel ?? "4 / 6"} />
              <SignalBar accent="tertiary" label={locale === "zh" ? "执行计时" : "Execution Timer"} value={hasRun ? Math.min(100, Math.round(elapsedMs / 300)) : content.state.metrics[2]?.progress ?? 35} valueLabel={hasRun ? formatElapsed(elapsedMs) : content.state.metrics[2]?.valueLabel ?? "00:07.12"} />
            </div>
            {sources.length > 0 && (
              <div className="mt-8">
                <p className="font-label-ui mb-3 text-[10px] uppercase tracking-[0.24em] text-foreground-muted">{copy.sourcesLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s) => <SignalPill accent="secondary" key={s.path}>{s.title}</SignalPill>)}
                </div>
              </div>
            )}
            {provider && !isRunning && (
              <p className="mt-6 font-label-ui text-[10px] uppercase tracking-[0.12em] text-foreground-muted/50">{provider}</p>
            )}
          </GlassPanel>
        </aside>
      </div>

      {/* ── Artifact Workspace ── */}
      {artifacts.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <AccentEyebrow accent="secondary">{copy.artifactsLabel}</AccentEyebrow>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {(["preview", "source", "metadata", "diff"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setArtifactView(tab)}
                  className={[
                    "rounded-md px-3 py-1 font-label-ui text-[10px] uppercase tracking-[0.12em] transition-colors",
                    artifactView === tab ? "bg-secondary/15 text-secondary" : "text-foreground-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {tab === "preview" ? copy.previewTab : tab === "source" ? copy.sourceTab : tab === "metadata" ? copy.metadataTab : copy.diffTab}
                </button>
              ))}
            </div>
          </div>

          {/* Artifact pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {artifacts.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setActiveArtifactId(art.id)}
                className={[
                  "rounded-full border px-3 py-1 font-label-ui text-[10px] uppercase tracking-[0.16em] transition-colors",
                  art.id === activeArtifactId
                    ? "border-secondary/40 bg-secondary/10 text-secondary"
                    : "border-white/10 bg-white/5 text-foreground-muted hover:bg-white/10",
                ].join(" ")}
              >
                {art.title}
                <span className="ml-1 opacity-50">· {art.kind.toUpperCase()}</span>
                {art.status === "streaming" && <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />}
              </button>
            ))}
          </div>

          {/* Version history */}
          {activeArtifactVersions.length > 0 && (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-label-ui text-[10px] uppercase tracking-[0.14em] text-foreground-muted/50">
                  {locale === "zh" ? "版本历史" : "Version History"}
                </p>
                <span className="font-label-ui text-[10px] text-foreground-muted/30">
                  {activeArtifactVersions.length} {locale === "zh" ? "个版本" : "versions"}
                </span>
              </div>
              <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {[...activeArtifactVersions].reverse().map((version, vi) => {
                  const isLatest = vi === 0;
                  const isSelected = selectedHistoryVersionId
                    ? selectedHistoryVersionId === version.versionId
                    : !isLatest && version.versionId === selectedHistoryVersion?.versionId;
                  return (
                    <button
                      key={version.versionId}
                      type="button"
                      onClick={() => setSelectedHistoryVersionId(version.versionId)}
                      className={[
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left font-label-ui text-[10px] transition-colors",
                        isSelected ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-white/5 bg-white/[0.02] text-foreground-muted hover:border-white/10",
                      ].join(" ")}
                    >
                      <span>Run {version.runId}</span>
                      <span className="text-foreground-muted/40">{isLatest ? (locale === "zh" ? "最新" : "Latest") : version.timestamp || "--"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeArtifact && (
            <GlassPanel className="rounded-[20px] p-1">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-label-ui text-[10px] uppercase tracking-[0.16em] text-foreground-muted">{activeArtifact.title}</span>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-label-ui text-[9px] uppercase text-secondary">{activeArtifact.kind}</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeArtifact.status === "streaming" && <StatusChip tone="tertiary" pulse>{locale === "zh" ? "生成中" : "Streaming"}</StatusChip>}
                  {activeArtifact.status === "done" && (
                    <>
                      <button type="button" onClick={() => handleCopy(activeArtifact.id, cleanArtifactContent(activeArtifact.content, activeArtifact.kind))} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-label-ui text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:bg-white/10">
                        {copiedId === activeArtifact.id ? copy.copiedLabel : copy.copyLabel}
                      </button>
                      <button type="button" onClick={() => handleDownload(activeArtifact)} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-label-ui text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:bg-white/10">
                        {copy.downloadLabel}
                      </button>
                      {artifactView === "preview" && activeArtifact.kind === "html" && (
                        <button type="button" onClick={() => setFullscreenOpen(true)} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-label-ui text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:bg-white/10">
                          {locale === "zh" ? "全屏" : "Fullscreen"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-b-[18px]">
                {artifactView === "preview" ? (
                  renderArtifactPreview(activeArtifact, locale)
                ) : artifactView === "source" ? (
                  activeArtifact.content ? (
                    <HighlightedCodeBlock
                      code={cleanArtifactContent(activeArtifact.content, activeArtifact.kind)}
                      language={getArtifactDisplayLanguage(activeArtifact)}
                    />
                  ) : (
                    <GeneratingPlaceholder locale={locale} done={activeArtifact.status === "done"} />
                  )
                ) : artifactView === "metadata" ? (
                  activeArtifactMetadata ? (
                    <div className="space-y-4 p-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { label: locale === "zh" ? "类型" : "Type", value: activeArtifactMetadata.kind },
                          { label: locale === "zh" ? "状态" : "Status", value: activeArtifactMetadata.status },
                          { label: locale === "zh" ? "文件名" : "File Name", value: activeArtifactMetadata.fileName },
                          { label: locale === "zh" ? "预览" : "Preview", value: activeArtifactMetadata.hasPreview ? "Yes" : "No" },
                          { label: locale === "zh" ? "字符数" : "Characters", value: String(activeArtifactMetadata.chars) },
                          { label: locale === "zh" ? "行数" : "Lines", value: String(activeArtifactMetadata.lines) },
                          { label: locale === "zh" ? "版本数" : "Versions", value: String(activeArtifactMetadata.versions) },
                          { label: locale === "zh" ? "最新版本" : "Latest Version", value: activeArtifactMetadata.latestVersion ? `Run ${activeArtifactMetadata.latestVersion.runId} · ${activeArtifactMetadata.latestVersion.timestamp || "--"}` : "--" },
                        ].map((field) => (
                          <div key={field.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="font-label-ui text-[10px] uppercase tracking-[0.14em] text-foreground-muted/40">{field.label}</p>
                            <p className="mt-1.5 text-sm text-foreground-muted break-all">{field.value}</p>
                          </div>
                        ))}
                      </div>
                      {activeArtifactMetadata.jsonKeys.length > 0 && (
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                          <p className="font-label-ui text-[10px] uppercase tracking-[0.14em] text-foreground-muted/40">JSON Keys</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {activeArtifactMetadata.jsonKeys.map((key) => (
                              <span key={key} className="rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-xs text-secondary">{key}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-[520px] items-center justify-center text-sm text-foreground-muted/40">
                      {locale === "zh" ? "暂无元数据" : "No metadata available"}
                    </div>
                  )
                ) : artifactView === "diff" ? (
                  activeArtifactVersions.length < 2 ? (
                    <div className="flex h-[520px] items-center justify-center text-sm text-foreground-muted/40">
                      {locale === "zh" ? "至少需要两个版本才能查看 Diff" : "Need at least two versions to view diff"}
                    </div>
                  ) : (
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2 font-label-ui text-[10px] text-foreground-muted/50">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {locale === "zh" ? "从" : "From"} Run {selectedHistoryVersion?.runId ?? "--"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {locale === "zh" ? "到" : "To"} Run {activeArtifactVersions[activeArtifactVersions.length - 1]?.runId}
                        </span>
                      </div>
                      {activeArtifactDiff ? (
                        <HighlightedCodeBlock code={activeArtifactDiff} language="diff" maxHeight="max-h-[420px]" />
                      ) : (
                        <div className="flex h-[320px] items-center justify-center text-sm text-foreground-muted/40">
                          {locale === "zh" ? "两个版本内容相同" : "No changes between versions"}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <GeneratingPlaceholder locale={locale} />
                )}
              </div>
            </GlassPanel>
          )}
        </section>
      )}

      {/* ── Final Answer ── */}
      {finalAnswer && hasRun && (
        <section className="mt-16">
          <AccentEyebrow accent="primary" className="mb-6">{copy.finalAnswerTitle}</AccentEyebrow>
          <GlassPanel className="rounded-[20px] border-l-2 border-l-primary/30 p-8">
            <div className="space-y-4">
              <RichContentRenderer content={finalAnswer} fallbackLanguage="text" />
              {isRunning && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />}
            </div>
            {!isRunning && finalAnswer && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy("final-answer", finalAnswer)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-label-ui text-[9px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:bg-white/10"
                >
                  {copiedId === "final-answer" ? copy.copiedLabel : copy.copyLabel}
                </button>
              </div>
            )}
          </GlassPanel>
        </section>
      )}

      {/* ── Mission Templates ── */}
      <section className="mt-24">
        <div className="mb-8 text-center">
          <h2 className="font-display-ui text-3xl font-semibold tracking-[-0.04em]">{content.templates.title}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {content.templates.items.map((item) => (
            <FeatureCard
              accent={item.accent}
              className={[accentRingClassNames[item.accent], "cursor-pointer"].join(" ")}
              description={item.description}
              eyebrow={copy.missionEyebrow}
              interactive
              key={item.title}
              onClick={() => void handleRun(item.title)}
              title={item.title}
            >
              <div className={["mt-1 inline-flex rounded-full px-3 py-1 font-label-ui text-[10px] uppercase tracking-[0.2em]", accentSurfaceClassNames[item.accent], accentTextClassNames[item.accent]].join(" ")}>
                {copy.missionBadge}
              </div>
            </FeatureCard>
          ))}
        </div>
      </section>

      {/* ── Fullscreen HTML Preview ── */}
      {fullscreenOpen && activeArtifact?.kind === "html" && activeArtifact.content && (() => {
        const cleanedHtml = cleanArtifactContent(activeArtifact.content, "html");
        return (
          <div
            className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={activeArtifact.title}
            onKeyDown={(e) => { if (e.key === "Escape") setFullscreenOpen(false); }}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="font-label-ui text-[10px] uppercase tracking-[0.16em] text-foreground-muted">{activeArtifact.title}</span>
                <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-label-ui text-[9px] uppercase text-secondary">HTML</span>
              </div>
              <button type="button" onClick={() => setFullscreenOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-label-ui text-[10px] uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:bg-white/10">
                {locale === "zh" ? "关闭" : "Close"}
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <iframe srcDoc={injectScrollbarStyles(cleanedHtml)} className="h-full w-full border-0" sandbox="allow-scripts allow-same-origin" title={`${activeArtifact.title} - Fullscreen`} />
            </div>
          </div>
        );
      })()}
    </main>
  );
}
