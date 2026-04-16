"use client";

import { type LocalizedValue } from "@ai-site/content";
import {
  GlassPanel,
  MetricTile,
  SignalBar,
  SignalPill,
} from "@ai-site/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalizedValue, useSiteLocale } from "../locale-provider";

/* ------------------------------------------------------------------ */
/*  i18n copy                                                          */
/* ------------------------------------------------------------------ */

interface KnowledgeCopy {
  eyebrow: string;
  subtitle: string;
  placeholder: string;
  search: string;
  searching: string;
  resultsTitle: string;
  resultsEmpty: string;
  indexTitle: string;
  indexStatus: string;
  sources: string;
  stars: string;
  key: string;
  github: string;
  blog: string;
  flagship: string;
  collections: string;
  pipelineTitle: string;
  pipelineDesc: string;
  emptyHint: string;
  suggestHint: string;
  scoreLabel: string;
  noResults: string;
}

const copyByLocale: LocalizedValue<KnowledgeCopy> = {
  zh: {
    eyebrow: "RAG KNOWLEDGE ENGINE",
    subtitle: "基于真实 GitHub Repo 和 Blog 数据的混合检索系统，查询被拆解为词项，在静态内容与实时 source records 上打分排序。",
    placeholder: "试试：React Server Components、AI 项目、工作经历...",
    search: "检索",
    searching: "检索中...",
    resultsTitle: "检索结果",
    resultsEmpty: "输入一个问题，AI 会在知识库中查找最相关的片段。",
    indexTitle: "知识库索引",
    indexStatus: "READY",
    sources: "总文档数",
    stars: "GitHub Stars",
    key: "Source Key",
    github: "GitHub Repos",
    blog: "Blog Articles",
    flagship: "Flagship Repos",
    collections: "已索引集合",
    pipelineTitle: "检索流程",
    pipelineDesc: "每次查询经过四个阶段得到相关结果：",
    emptyHint: "点击上方模板，或输入任意问题开始检索。",
    suggestHint: "快速试试：",
    scoreLabel: "相关度",
    noResults: "未找到相关结果，换个关键词试试。",
  },
  en: {
    eyebrow: "RAG KNOWLEDGE ENGINE",
    subtitle: "Hybrid retrieval system over live GitHub & Blog data. Queries are tokenized, then scored and ranked across static content and real-time source records.",
    placeholder: "Try: React Server Components, AI projects, work experience...",
    search: "Search",
    searching: "Searching...",
    resultsTitle: "Retrieval Results",
    resultsEmpty: "Ask anything — the engine finds the most relevant chunks from the knowledge base.",
    indexTitle: "Knowledge Index",
    indexStatus: "READY",
    sources: "Total Sources",
    stars: "GitHub Stars",
    key: "Source Key",
    github: "GitHub Repos",
    blog: "Blog Articles",
    flagship: "Flagship Repos",
    collections: "Indexed Collections",
    pipelineTitle: "Retrieval Pipeline",
    pipelineDesc: "Every query passes through four stages to surface relevant results:",
    emptyHint: "Click a template above, or type any question to start retrieval.",
    suggestHint: "Quick start:",
    scoreLabel: "Relevance",
    noResults: "No matching results. Try different keywords.",
  },
};

/* ------------------------------------------------------------------ */
/*  Preset queries                                                     */
/* ------------------------------------------------------------------ */

const presetQueries: Record<"zh" | "en", Array<{ icon: string; label: string; query: string }>> = {
  zh: [
    { icon: "🤖", label: "AI 项目", query: "AI 项目 机器学习 大模型" },
    { icon: "⚛️", label: "React 技术", query: "React Server Components Next.js" },
    { icon: "💼", label: "工作经历", query: "工作经历 前端 全栈开发" },
    { icon: "🛠️", label: "开源贡献", query: "开源项目 npm 包发布" },
    { icon: "🧠", label: "RAG 知识库", query: "向量检索 RAG 知识库 embedding" },
    { icon: "📝", label: "博客文章", query: "技术博客 文章 分享" },
  ],
  en: [
    { icon: "🤖", label: "AI Projects", query: "AI projects machine learning LLM" },
    { icon: "⚛️", label: "React", query: "React Server Components Next.js frontend" },
    { icon: "💼", label: "Work Experience", query: "work experience full-stack engineer" },
    { icon: "🛠️", label: "Open Source", query: "open source npm packages contributions" },
    { icon: "🧠", label: "RAG Pipeline", query: "vector retrieval RAG knowledge embedding" },
    { icon: "📝", label: "Blog Posts", query: "technical blog posts articles" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Pipeline steps                                                     */
/* ------------------------------------------------------------------ */

const pipelineSteps: Record<"zh" | "en", Array<{ step: string; label: string; desc: string; accent: string }>> = {
  zh: [
    { step: "01", label: "分词", desc: "拆解为拉丁词项 + CJK 双字组合，去重后最多保留 10 个词", accent: "text-primary" },
    { step: "02", label: "聚合文档", desc: "合并静态内容、DESIGN.md、开源资料、DB source records 四类文档", accent: "text-secondary" },
    { step: "03", label: "打分排名", desc: "标题命中 +6 分，内容命中 +3 分，重复出现额外加分，最终按分数降序", accent: "text-tertiary" },
    { step: "04", label: "返回结果", desc: "取 Top-N 命中，提取 420 字符摘要片段，附 source path 与 score", accent: "text-primary" },
  ],
  en: [
    { step: "01", label: "Tokenize", desc: "Split into Latin terms + CJK bigrams, deduplicated, max 10 terms", accent: "text-primary" },
    { step: "02", label: "Aggregate Docs", desc: "Merge static content, DESIGN.md, open-source docs, and DB source records", accent: "text-secondary" },
    { step: "03", label: "Score & Rank", desc: "Title hit +6, content hit +3, repeat bonus, sorted by score descending", accent: "text-tertiary" },
    { step: "04", label: "Return Hits", desc: "Top-N hits extracted with 420-char snippet, source path and score attached", accent: "text-primary" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface KnowledgeIndexResponse {
  index: {
    blogSourceCount: number;
    flagshipRepos: Array<{ linkedPosts: string[]; packageName: string | null; repoName: string }>;
    githubSourceCount: number;
    sourceKey: string;
    totalStars: number;
  };
  status: string;
}

interface KnowledgeHit {
  path: string;
  score: number;
  snippet: string;
  title: string;
}

interface KnowledgeSearchResponse {
  hits: KnowledgeHit[];
  locale: "zh" | "en";
  openSourceContext: {
    flagshipRepos: Array<{ packageName: string | null; repoName: string }>;
    sourceKey: string;
  };
  query: string;
  status: string;
}

function resolveSourceLabel(path: string): string {
  const n = path.toLowerCase();
  if (n.includes("github.com")) return "GitHub";
  if (n.includes("blog") || n.endsWith(".md")) return "Blog";
  if (n.includes("design") || n.includes("memory")) return "Docs";
  if (n.startsWith("packages/content")) return "Profile";
  return "Knowledge";
}

function resolveSourceAccent(label: string): "primary" | "secondary" | "tertiary" {
  if (label === "GitHub") return "primary";
  if (label === "Blog") return "secondary";
  return "tertiary";
}

/** Highlight query terms in snippet text, returns array of {text, highlight} parts */
function highlightTerms(snippet: string, queryTerms: string[]): Array<{ text: string; hl: boolean }> {
  if (queryTerms.length === 0) return [{ text: snippet, hl: false }];

  // Build a regex that matches any of the terms (case-insensitive)
  const escaped = queryTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = snippet.split(pattern);

  return parts.map((part) => ({
    hl: pattern.test(part),
    text: part,
  }));
}

function extractTerms(query: string): string[] {
  const normalized = query.toLowerCase().replace(/\s+/g, " ").trim();
  const latinTerms = normalized.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 1);
  const cjkTerms = normalized.match(/[\u4E00-\u9FFF\u3400-\u4DBF]{2,}/g) ?? [];
  return [...new Set([...latinTerms, ...cjkTerms])].slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Score bar                                                         */
/* ------------------------------------------------------------------ */

function ScoreBar({ score, maxScore, accent }: { score: number; maxScore: number; accent: "primary" | "secondary" | "tertiary" }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const colorClass = accent === "primary" ? "bg-primary" : accent === "secondary" ? "bg-secondary" : "bg-tertiary";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
        <div className={["h-full rounded-full transition-all duration-500", colorClass].join(" ")} style={{ width: `${pct}%` }} />
      </div>
      <span className={["font-display-ui text-xs font-bold", accent === "primary" ? "text-primary" : accent === "secondary" ? "text-secondary" : "text-tertiary"].join(" ")}>
        {score}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function KnowledgeBasePage() {
  const copy = useLocalizedValue(copyByLocale);
  const { locale } = useSiteLocale();
  const loc = locale === "zh" ? "zh" : "en";

  const [query, setQuery] = useState("");
  const [indexData, setIndexData] = useState<KnowledgeIndexResponse | null>(null);
  const [searchData, setSearchData] = useState<KnowledgeSearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isIndexLoading, setIsIndexLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadIndex() {
      try {
        const res = await fetch("/api/knowledge");
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as KnowledgeIndexResponse;
        if (!cancelled) setIndexData(data);
      } catch { /* noop */ } finally {
        if (!cancelled) setIsIndexLoading(false);
      }
    }
    void loadIndex();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setQuery(q);

    try {
      const res = await fetch("/api/knowledge", {
        body: JSON.stringify({ limit: 6, locale: loc, query: q }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(e?.message ?? `${res.status}`);
      }
      const data = (await res.json()) as KnowledgeSearchResponse;
      setSearchData(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setSearchData(null);
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, [loc, query]);

  const queryTerms = useMemo(() => (searchData ? extractTerms(searchData.query) : []), [searchData]);
  const maxScore = useMemo(() => Math.max(...(searchData?.hits.map((h) => h.score) ?? [1])), [searchData]);

  const totalSources = indexData
    ? indexData.index.githubSourceCount + indexData.index.blogSourceCount
    : null;

  const collections = useMemo(() => {
    if (!indexData) return [];
    return [...new Set(
      indexData.index.flagshipRepos.flatMap((r) =>
        [r.packageName, r.repoName.split("/").pop() ?? r.repoName].filter(Boolean) as string[]
      )
    )].slice(0, 8);
  }, [indexData]);

  const presets = presetQueries[loc];
  const pipeline = pipelineSteps[loc];

  return (
    <main className="relative overflow-x-hidden">
      {/* ============ Hero ============ */}
      <section className="relative flex flex-col items-center overflow-hidden px-6 pb-12 pt-24 md:px-10">
        <div className="pointer-events-none absolute -left-16 top-20 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
        <div className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-secondary/10 blur-[140px]" />

        <div className="relative z-10 w-full max-w-4xl text-center">
          <p className="mb-4 font-display-ui text-xs font-black uppercase tracking-[0.4em] text-primary">
            {copy.eyebrow}
          </p>
          <h1 className="font-display-ui text-[clamp(3rem,10vw,7rem)] font-black uppercase italic leading-none tracking-tighter text-foreground/10 [text-stroke:1px_rgba(255,255,255,0.08)]">
            KNOWLEDGE
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-foreground-muted">
            {copy.subtitle}
          </p>

          {/* Search bar */}
          <div className="mt-10">
            <div className="relative mx-auto max-w-2xl">
              <input
                className="w-full rounded-2xl border border-white/[0.08] bg-surface-low px-6 py-4 pr-36 text-base outline-none transition-colors placeholder:text-foreground-muted/40 focus:border-primary"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }}
                placeholder={copy.placeholder}
                type="text"
                value={query}
              />
              <button
                className={[
                  "absolute bottom-2 right-2 top-2 rounded-xl px-6 font-display-ui text-sm font-bold transition-all",
                  isSearching
                    ? "cursor-not-allowed bg-white/5 text-foreground-muted"
                    : "bg-gradient-to-r from-primary to-primary/70 text-background hover:brightness-110 active:scale-95",
                ].join(" ")}
                disabled={isSearching}
                onClick={() => void handleSearch()}
                type="button"
              >
                {isSearching ? copy.searching : copy.search}
              </button>
            </div>

            {/* Preset chips */}
            <div className="mt-5">
              <p className="mb-3 text-center text-[10px] uppercase tracking-widest text-foreground-muted/50">{copy.suggestHint}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {presets.map((p) => (
                  <button
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs transition-all hover:-translate-y-0.5",
                      query === p.query
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 text-foreground-muted hover:border-white/20 hover:text-foreground",
                    ].join(" ")}
                    key={p.label}
                    onClick={() => void handleSearch(p.query)}
                    type="button"
                  >
                    <span className="mr-1">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Results + Index Panel ============ */}
      <section ref={resultsRef} className="px-4 py-16 md:px-12">
        <div className="mx-auto grid max-w-screen-2xl gap-10 xl:grid-cols-[minmax(0,1.15fr)_340px]">

          {/* Results */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="font-label-ui text-[10px] uppercase tracking-[0.3em] text-primary">{copy.resultsTitle}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {searchError
                    ? searchError
                    : isSearching
                      ? copy.searching + "..."
                      : searchData
                        ? `${searchData.hits.length} hits for "${searchData.query}"`
                        : copy.resultsEmpty}
                </p>
              </div>
              {searchData && (
                <SignalPill accent="primary">{searchData.hits.length} hits</SignalPill>
              )}
            </div>

            {!searchData && !isSearching && (
              <div className="rounded-2xl border border-white/5 bg-surface-lowest p-12 text-center">
                <p className="text-4xl opacity-20">🔍</p>
                <p className="mt-4 text-sm text-foreground-muted">{copy.emptyHint}</p>
              </div>
            )}

            {isSearching && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div className="h-32 animate-pulse rounded-2xl border border-white/5 bg-surface-lowest" key={i} />
                ))}
              </div>
            )}

            {searchData && !isSearching && (
              <div className="space-y-4">
                {searchData.hits.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-surface-lowest p-12 text-center">
                    <p className="text-sm text-foreground-muted">{copy.noResults}</p>
                  </div>
                ) : (
                  searchData.hits.map((hit, idx) => {
                    const sourceLabel = resolveSourceLabel(hit.path);
                    const accent = resolveSourceAccent(sourceLabel);
                    const highlighted = highlightTerms(hit.snippet, queryTerms);
                    const isLive = hit.path.startsWith("http");

                    return (
                      <div
                        className={[
                          "rounded-2xl border bg-surface-lowest p-6 transition-all hover:bg-surface-low",
                          accent === "primary" ? "border-primary/15" : accent === "secondary" ? "border-secondary/15" : "border-tertiary/15",
                        ].join(" ")}
                        key={idx}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className={["font-label-ui text-[10px] uppercase tracking-[0.2em]", accent === "primary" ? "text-primary" : accent === "secondary" ? "text-secondary" : "text-tertiary"].join(" ")}>
                              {sourceLabel}
                            </span>
                            {isLive && (
                              <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-green-400">
                                Live
                              </span>
                            )}
                          </div>
                          <ScoreBar accent={accent} maxScore={maxScore} score={hit.score} />
                        </div>

                        {/* Title */}
                        <h3 className="mt-2 font-display-ui text-lg font-semibold leading-tight tracking-tight">
                          {hit.title}
                        </h3>

                        {/* Snippet with term highlighting */}
                        <p className="mt-3 text-sm leading-6 text-foreground-muted">
                          {highlighted.map((part, pi) =>
                            part.hl ? (
                              <mark className="rounded bg-primary/20 px-0.5 text-primary not-italic" key={pi}>
                                {part.text}
                              </mark>
                            ) : (
                              <span key={pi}>{part.text}</span>
                            )
                          )}
                        </p>

                        {/* Path */}
                        <p className="mt-3 truncate font-mono text-[10px] text-foreground-muted/40">
                          {hit.path}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Index Panel */}
          <aside className="xl:sticky xl:top-28 xl:h-fit">
            <GlassPanel className="rounded-[24px] p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display-ui text-xl font-bold">{copy.indexTitle}</h2>
                <SignalPill accent="secondary">
                  {isSearching ? "SEARCH" : isIndexLoading ? "LOADING" : copy.indexStatus}
                </SignalPill>
              </div>

              {/* Metrics */}
              <div className="mt-6 grid grid-cols-3 gap-3 xl:grid-cols-1">
                <MetricTile
                  accent="primary"
                  label={copy.sources}
                  value={totalSources != null ? String(totalSources) : "—"}
                  variant="soft"
                />
                <MetricTile
                  accent="secondary"
                  label={copy.stars}
                  value={indexData ? String(indexData.index.totalStars) : "—"}
                  variant="soft"
                />
                <MetricTile
                  accent="tertiary"
                  label={copy.key}
                  value={indexData?.index.sourceKey ?? "—"}
                  variant="soft"
                />
              </div>

              {/* Signal bars */}
              <div className="mt-6 space-y-4">
                <SignalBar
                  accent="primary"
                  label={copy.github}
                  value={indexData ? Math.min(100, indexData.index.githubSourceCount * 8) : 0}
                  valueLabel={indexData ? String(indexData.index.githubSourceCount) : "0"}
                />
                <SignalBar
                  accent="secondary"
                  label={copy.blog}
                  value={indexData ? Math.min(100, indexData.index.blogSourceCount * 8) : 0}
                  valueLabel={indexData ? String(indexData.index.blogSourceCount) : "0"}
                />
                <SignalBar
                  accent="tertiary"
                  label={copy.flagship}
                  value={indexData ? Math.min(100, indexData.index.flagshipRepos.length * 24) : 0}
                  valueLabel={indexData ? String(indexData.index.flagshipRepos.length) : "0"}
                />
              </div>

              {/* Collections */}
              {collections.length > 0 && (
                <div className="mt-6">
                  <p className="font-label-ui text-[10px] uppercase tracking-[0.24em] text-foreground-muted">{copy.collections}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {collections.map((c) => (
                      <SignalPill accent="primary" key={c}>{c}</SignalPill>
                    ))}
                  </div>
                </div>
              )}
            </GlassPanel>

            {/* Source distribution (after search) */}
            {searchData && searchData.hits.length > 0 && (
              <div className="mt-4 rounded-2xl border border-white/5 bg-surface-lowest p-5">
                <p className="font-label-ui text-[10px] uppercase tracking-widest text-foreground-muted">
                  {loc === "zh" ? "来源分布" : "Source Distribution"}
                </p>
                <div className="mt-3 space-y-2">
                  {Object.entries(
                    searchData.hits.reduce<Record<string, number>>((acc, h) => {
                      const l = resolveSourceLabel(h.path);
                      acc[l] = (acc[l] ?? 0) + 1;
                      return acc;
                    }, {})
                  ).map(([src, count]) => {
                    const pct = Math.round((count / searchData.hits.length) * 100);
                    const accent = resolveSourceAccent(src);
                    return (
                      <div className="flex items-center gap-2" key={src}>
                        <span className="w-16 shrink-0 text-[10px] text-foreground-muted">{src}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={accent === "primary" ? "h-full bg-primary" : accent === "secondary" ? "h-full bg-secondary" : "h-full bg-tertiary"}
                            style={{ width: `${pct}%`, transition: "width 0.5s" }}
                          />
                        </div>
                        <span className="w-6 text-right text-[10px] text-foreground-muted">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ============ Pipeline Visualization ============ */}
      <section className="bg-surface-low px-4 py-20 md:px-12">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12 text-center">
            <p className="font-label-ui text-[10px] uppercase tracking-[0.3em] text-secondary">{copy.pipelineTitle}</p>
            <p className="mt-3 text-sm text-foreground-muted">{copy.pipelineDesc}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {pipeline.map((step, idx) => (
              <div className="relative" key={step.step}>
                {/* Connector line */}
                {idx < pipeline.length - 1 && (
                  <div className="absolute -right-3 top-8 z-10 hidden h-px w-6 bg-gradient-to-r from-white/10 to-transparent xl:block" />
                )}
                <div className="rounded-2xl border border-white/5 bg-surface-lowest p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={["font-display-ui text-4xl font-black opacity-20", step.accent].join(" ")}>
                      {step.step}
                    </span>
                    <h3 className={["font-display-ui text-lg font-bold", step.accent].join(" ")}>
                      {step.label}
                    </h3>
                  </div>
                  <p className="text-sm leading-6 text-foreground-muted">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Data flow bar */}
          <div className="mt-10 flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {[
              { label: loc === "zh" ? "静态内容" : "Static Content", accent: "bg-primary/20 text-primary border-primary/20" },
              { label: "+", accent: "text-foreground-muted/30" },
              { label: loc === "zh" ? "DESIGN.md" : "DESIGN.md", accent: "bg-secondary/20 text-secondary border-secondary/20" },
              { label: "+", accent: "text-foreground-muted/30" },
              { label: loc === "zh" ? "GitHub Records" : "GitHub Records", accent: "bg-primary/10 text-primary/70 border-primary/10" },
              { label: "+", accent: "text-foreground-muted/30" },
              { label: loc === "zh" ? "Blog Records" : "Blog Records", accent: "bg-tertiary/20 text-tertiary border-tertiary/20" },
              { label: "→", accent: "text-foreground-muted/30" },
              { label: loc === "zh" ? "混合检索" : "Hybrid Retrieval", accent: "bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border-white/10" },
            ].map((item, i) =>
              item.label === "+" || item.label === "→" ? (
                <span className={["font-bold text-lg", item.accent].join(" ")} key={i}>{item.label}</span>
              ) : (
                <span
                  className={["shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold", item.accent].join(" ")}
                  key={i}
                >
                  {item.label}
                </span>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
