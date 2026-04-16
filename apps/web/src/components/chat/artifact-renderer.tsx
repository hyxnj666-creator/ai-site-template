"use client";

import type {
  AiArtifact,
  ExecutionReviewArtifact,
  KnowledgeSignalRadarArtifact,
  ProjectTimelineArtifact,
  TechRadarArtifact,
} from "@ai-site/ai";

/* ------------------------------------------------------------------ */
/*  ExecutionReview — tool call steps timeline                        */
/* ------------------------------------------------------------------ */

const STEP_ICONS: Record<string, string> = {
  searchKnowledge: "🔍",
  loadPromptContext: "⚡",
  normalizePrompt: "✏️",
  emitArtifacts: "📦",
  "openai.streamText": "🤖",
  "openai.generateText": "🤖",
  fallbackSynthesis: "🔄",
};

function getStepIcon(name: string): string {
  return STEP_ICONS[name] ?? "▸";
}

function ExecutionReviewRenderer({ payload }: { payload: ExecutionReviewArtifact }) {
  return (
    <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#0d0d0d]/60 p-4">
      <p className="mb-3 font-label-ui text-[9px] uppercase tracking-[0.3em] text-foreground-muted/50">
        Execution Trace
      </p>
      <div className="space-y-1">
        {payload.steps.map((step, i) => (
          <div className="flex items-start gap-3 py-1.5" key={i}>
            {/* connector */}
            <div className="relative flex flex-col items-center">
              <div className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                step.status === "completed"
                  ? "bg-primary/15 text-primary"
                  : "bg-white/5 text-foreground-muted",
              ].join(" ")}>
                {step.status === "completed" ? "✓" : "…"}
              </div>
              {i < payload.steps.length - 1 && (
                <div className="mt-1 h-full w-px bg-white/[0.06]" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px]">{getStepIcon(step.name)}</span>
                <span className="font-mono text-[11px] font-semibold text-foreground/80">{step.name}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-5 text-foreground-muted/60">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KnowledgeSignalRadar — 6-axis bars + sources                      */
/* ------------------------------------------------------------------ */

const RADAR_AXIS_LABELS: Record<number, { zh: string; en: string }> = {
  0: { zh: "上下文相关度", en: "Context Relevance" },
  1: { zh: "工具调用深度", en: "Tool Depth" },
  2: { zh: "来源覆盖率", en: "Source Coverage" },
  3: { zh: "模型匹配度", en: "Model Fit" },
  4: { zh: "知识新鲜度", en: "Knowledge Freshness" },
  5: { zh: "响应效率", en: "Response Efficiency" },
};

function KnowledgeSignalRadarRenderer({
  payload,
  locale,
}: {
  payload: KnowledgeSignalRadarArtifact;
  locale: "zh" | "en";
}) {
  const maxScore = payload.scores.length > 0 ? Math.max(...payload.scores) : 1;

  return (
    <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#0d0d0d]/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-label-ui text-[9px] uppercase tracking-[0.3em] text-foreground-muted/50">
          Knowledge Signal
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-secondary/60">{payload.latencyMs}s</span>
          <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[10px] text-primary">{payload.efficiencyScore}%</span>
          </div>
        </div>
      </div>

      {/* Signal bars */}
      <div className="space-y-2">
        {payload.scores.map((score, i) => {
          const label = RADAR_AXIS_LABELS[i]?.[locale] ?? `Axis ${i + 1}`;
          const pct = Math.round((score / 100) * 100);
          return (
            <div className="flex items-center gap-3" key={i}>
              <span className="w-28 shrink-0 text-[10px] text-foreground-muted/60">{label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className={[
                    "h-full rounded-full transition-all duration-700",
                    i % 2 === 0 ? "bg-primary/70" : "bg-secondary/70",
                  ].join(" ")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-7 text-right font-mono text-[10px] text-foreground-muted/40">{score}</span>
            </div>
          );
        })}
      </div>

      {/* Sources */}
      {payload.sources.length > 0 && (
        <div className="mt-4 border-t border-white/[0.04] pt-3">
          <p className="mb-2 font-label-ui text-[9px] uppercase tracking-[0.3em] text-foreground-muted/40">
            {locale === "zh" ? "引用来源" : "Sources"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {payload.sources.map((src, i) => (
              <span
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 font-label-ui text-[10px] text-foreground-muted/60"
                key={`${src.path}-${i}`}
                title={src.path}
              >
                {src.title.length > 32 ? src.title.slice(0, 32) + "…" : src.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TechRadar — metric bar chart                                      */
/* ------------------------------------------------------------------ */

function TechRadarRenderer({ payload }: { payload: TechRadarArtifact }) {
  const maxVal = Math.max(...payload.metrics.map((m) => m.value), 100);

  return (
    <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#0d0d0d]/60 p-4">
      <p className="mb-3 font-label-ui text-[9px] uppercase tracking-[0.3em] text-foreground-muted/50">
        {payload.title}
      </p>
      <div className="space-y-2.5">
        {payload.metrics.map((metric) => {
          const pct = Math.round((metric.value / maxVal) * 100);
          return (
            <div className="flex items-center gap-3" key={metric.label}>
              <span className="w-32 shrink-0 text-[10px] text-foreground-muted/60">{metric.label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-tertiary/70 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[10px] text-tertiary/60">{metric.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProjectTimeline — vertical timeline cards                         */
/* ------------------------------------------------------------------ */

function ProjectTimelineRenderer({
  payload,
  locale,
}: {
  payload: ProjectTimelineArtifact;
  locale: "zh" | "en";
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#0d0d0d]/60 p-4">
      <p className="mb-4 font-label-ui text-[9px] uppercase tracking-[0.3em] text-foreground-muted/50">
        {locale === "zh" ? "项目与经历" : "Projects & Experience"}
      </p>
      <div className="relative">
        {/* Vertical rail */}
        <div className="absolute left-[7px] top-0 h-full w-px bg-white/[0.06]" />
        <div className="space-y-5 pl-7">
          {payload.items.map((item, i) => (
            <div className="relative" key={i}>
              {/* Dot */}
              <div className={[
                "absolute -left-7 top-[3px] h-3.5 w-3.5 rounded-full border",
                i === 0
                  ? "border-primary/50 bg-primary/20"
                  : "border-white/10 bg-white/5",
              ].join(" ")} />

              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold leading-snug text-foreground/90">
                    {item.title}
                  </h4>
                  <span className="shrink-0 font-mono text-[10px] text-primary/50">{item.year}</span>
                </div>
                {item.description && (
                  <p className="mt-1.5 text-[11px] leading-5 text-foreground-muted/60">
                    {item.description}
                  </p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span
                        className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[9px] text-foreground-muted/50"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dispatcher                                                   */
/* ------------------------------------------------------------------ */

export function ArtifactRenderer({
  artifact,
  locale = "en",
}: {
  artifact: AiArtifact;
  locale?: "zh" | "en";
}) {
  switch (artifact.kind) {
    case "executionReview":
      return <ExecutionReviewRenderer payload={artifact.payload} />;
    case "knowledgeSignalRadar":
      return <KnowledgeSignalRadarRenderer locale={locale} payload={artifact.payload} />;
    case "techRadar":
      return <TechRadarRenderer payload={artifact.payload} />;
    case "projectTimeline":
      return <ProjectTimelineRenderer locale={locale} payload={artifact.payload} />;
    default:
      return null;
  }
}
