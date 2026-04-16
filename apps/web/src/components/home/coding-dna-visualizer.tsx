"use client";

import { useEffect, useRef, useState } from "react";
import type { CodingDnaData } from "@/app/api/coding-dna/route";
import { useInView } from "@/hooks/use-in-view";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface CodingDnaContent {
  eyebrow: string;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  reposLabel?: string;
  starsLabel?: string;
  followersLabel?: string;
  activityLabel?: string;
  languagesLabel?: string;
  commitsLabel?: string;
  primaryLangLabel?: string;
  dataLoadingLabel?: string;
  dataErrorLabel?: string;
  dataEmptyLabel?: string;
}

// ─── NumericCounter (animates whenever inView && to > 0) ───────────────────
function NumericCounter({ to, inView, delay = 0 }: { to: number; inView: boolean; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inView || to <= 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = 1200;
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * to));
      if (progress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 16);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inView, to]);

  return <span style={{ transitionDelay: `${delay}ms` }}>{display}</span>;
}

// ─── Activity bar chart (last 30 days) ────────────────────────────────────
function ActivityBars({ activity }: { activity: CodingDnaData["recentActivity"] }) {
  const max = Math.max(...activity.map((a) => a.count), 1);
  return (
    <div className="flex items-end gap-[2px] h-10">
      {activity.map((day) => {
        const h = day.count === 0 ? 2 : Math.max(4, (day.count / max) * 40);
        return (
          <div
            key={day.date}
            className="flex-1 rounded-sm transition-all duration-300"
            style={{
              height: `${h}px`,
              background: day.count > 0
                ? `rgba(208,188,255,${0.3 + (day.count / max) * 0.7})`
                : "rgba(255,255,255,0.06)",
            }}
            title={`${day.date}: ${day.count}`}
          />
        );
      })}
    </div>
  );
}

// ─── Language distribution bars ────────────────────────────────────────────
function LanguageBars({ languages, inView }: { languages: CodingDnaData["languages"]; inView: boolean }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (inView && languages.length > 0) {
      const t = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(t);
    }
  }, [inView, languages.length]);

  return (
    <div className="space-y-3">
      {languages.slice(0, 6).map((lang, i) => (
        <div key={lang.name}>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: lang.color }} />
              <span className="font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                {lang.name}
              </span>
            </div>
            <span className="font-label-ui text-[11px] text-foreground-muted">{lang.percent}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: animate ? `${lang.percent}%` : "0%",
                background: lang.color,
                transitionDelay: `${i * 120}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DNA strand visualization ───────────────────────────────────────────────
function DnaStrandViz({
  languages,
  inView,
  topLang,
  primaryLangLabel = "Primary Language",
}: {
  languages: CodingDnaData["languages"];
  inView: boolean;
  topLang?: { name: string; color: string; percent: number };
  primaryLangLabel?: string;
}) {
  const widths = ["w-64", "w-48", "w-56", "w-40", "w-52", "w-44", "w-60", "w-36"];
  const shifts = ["", "translate-x-8", "-translate-x-4", "translate-x-4", "-translate-x-2", "translate-x-6", "", "-translate-x-6"];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-surface-low px-8 py-10">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-72 -translate-x-1/2 bg-linear-to-b from-primary/15 via-secondary/10 to-tertiary/10 blur-3xl" />

      {/* Strands */}
      <div className="relative flex flex-col gap-5">
        {languages.slice(0, 8).map((lang, i) => (
          <div
            key={lang.name}
            className={[
              "flex items-center gap-4 transition-all duration-700",
              shifts[i] ?? "",
              inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
            ].join(" ")}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div
              className="h-3 w-3 shrink-0 rounded-full animate-[heartbeat_2s_ease-in-out_infinite]"
              style={{ background: lang.color, boxShadow: `0 0 16px ${lang.color}80`, animationDelay: `${i * 0.3}s` }}
            />
            <div className={["relative overflow-hidden", widths[i] ?? "w-48"].join(" ")}>
              <div className="h-px" style={{ background: `linear-gradient(to right, ${lang.color}50, ${lang.color}10)` }} />
              {inView && (
                <div
                  className="absolute inset-y-0 w-8 animate-[strand-travel_3s_linear_infinite]"
                  style={{ background: `linear-gradient(90deg, transparent, ${lang.color}99, transparent)`, animationDelay: `${i * 0.5}s` }}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-label-ui text-xs uppercase tracking-[0.22em]" style={{ color: lang.color }}>
                {lang.name}
              </span>
              <span className="font-label-ui text-[10px] text-foreground-muted">{lang.percent}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom badge: dominant language */}
      {topLang && (
        <div
          className={["relative mt-8 rounded-2xl border px-5 py-4 transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
          style={{
            borderColor: `${topLang.color}30`,
            background: `linear-gradient(135deg, ${topLang.color}08, transparent)`,
            transitionDelay: "700ms",
          }}
        >
          <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted/60">
            {primaryLangLabel}
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="font-display-ui text-2xl font-semibold tracking-[-0.04em]" style={{ color: topLang.color }}>
              {topLang.name}
            </span>
            <span className="font-label-ui text-3xl font-semibold tracking-[-0.05em]" style={{ color: `${topLang.color}cc` }}>
              {topLang.percent}%
            </span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: inView ? `${topLang.percent}%` : "0%",
                background: topLang.color,
                boxShadow: `0 0 10px ${topLang.color}80`,
                transitionDelay: "800ms",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton loader ────────────────────────────────────────────────────────
function SkeletonViz() {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-surface-low px-8 py-10 animate-pulse">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-72 -translate-x-1/2 bg-linear-to-b from-primary/10 to-transparent blur-3xl" />
      <div className="space-y-6 mt-4">
        {[64, 48, 56, 40, 52, 44].map((w, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-white/10" />
            <div className="h-px bg-white/10" style={{ width: `${w * 3}px` }} />
            <div className="h-3 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export function CodingDnaVisualizer({ content }: { content: CodingDnaContent }) {
  const { ref, inView } = useInView(0.12);
  const [data, setData] = useState<CodingDnaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/coding-dna")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (!cancelled) { setData(d as CodingDnaData); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const languages = data?.languages ?? [];
  const metrics = data?.metrics;
  const activity = data?.recentActivity ?? [];
  const totalCommits = activity.reduce((a, b) => a + b.count, 0);
  const topLang = languages[0];

  return (
    <div ref={ref}>
      {/* ── Row 1: DNA strand (left) + Heading & metrics (right) ── */}
      <div className="grid gap-8 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
        {/* Left: DNA strand viz */}
        <div
          className={["transition-all duration-700", inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"].join(" ")}
        >
          {loading ? (
            <SkeletonViz />
          ) : error ? (
            <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[28px] bg-surface-low px-8 py-10">
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-72 -translate-x-1/2 bg-linear-to-b from-red-500/5 to-transparent blur-3xl" />
              <span className="relative text-2xl">⚠️</span>
              <p className="relative max-w-[200px] text-center font-label-ui text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
                {content.eyebrow}
              </p>
              <p className="relative max-w-[240px] text-center text-xs text-foreground-muted/50">
                {content.dataErrorLabel ?? "Failed to load GitHub data. Please try again later."}
              </p>
            </div>
          ) : languages.length === 0 ? (
            <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[28px] bg-surface-low px-8 py-10">
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-72 -translate-x-1/2 bg-linear-to-b from-primary/10 to-transparent blur-3xl" />
              <span className="relative text-2xl">⚡</span>
              <p className="relative max-w-[200px] text-center font-label-ui text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
                {content.eyebrow}
              </p>
              <p className="relative max-w-[240px] text-center text-xs text-foreground-muted/50">
                {content.dataEmptyLabel ?? "No language data available yet."}
              </p>
            </div>
          ) : (
            <DnaStrandViz
              inView={inView}
              languages={languages}
              primaryLangLabel={content.primaryLangLabel}
              topLang={topLang}
            />
          )}
        </div>

        {/* Right: Heading + qualitative metrics + GitHub stats */}
        <div
          className={["flex flex-col justify-center transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"].join(" ")}
          style={{ transitionDelay: "200ms" }}
        >
          {/* Heading */}
          <div>
            <p className="font-label-ui text-xs uppercase tracking-[0.28em] text-foreground-muted">
              {content.eyebrow}
            </p>
            <h2 className="font-display-ui mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              {content.title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">
              {content.description}
            </p>
          </div>

          {/* Qualitative metric cards */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {content.metrics.map((m, i) => {
              const colors = [
                "border-primary/15 bg-primary/5 text-primary",
                "border-secondary/15 bg-secondary/5 text-secondary",
                "border-tertiary/15 bg-tertiary/5 text-tertiary",
              ];
              return (
                <div
                  key={m.label}
                  className={[
                    "rounded-2xl border px-4 py-4 transition-all duration-700",
                    colors[i % 3],
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                  ].join(" ")}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] opacity-70">{m.label}</p>
                  <p className="font-display-ui mt-2 text-xl font-semibold tracking-[-0.04em]">{m.value}</p>
                </div>
              );
            })}
          </div>

          {/* GitHub live stats */}
          {metrics && (
            <div
              className={["mt-4 grid grid-cols-1 gap-3 transition-all duration-700 sm:grid-cols-3", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
              style={{ transitionDelay: "520ms" }}
            >
              {[
                { label: content.reposLabel ?? "Repos", value: metrics.repos },
                { label: content.starsLabel ?? "Stars", value: metrics.stars },
                { label: content.followersLabel ?? "Followers", value: metrics.followers },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
                  <p className="font-label-ui text-[10px] uppercase tracking-[0.2em] text-foreground-muted">{stat.label}</p>
                  <p className="font-display-ui mt-1 text-2xl font-semibold tracking-[-0.04em]">
                    <NumericCounter delay={0} inView={inView} to={stat.value} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Language distribution + Activity — full width ── */}
      {!loading && languages.length > 0 && (
        <div
          className={["mt-6 grid gap-6 transition-all duration-700 sm:grid-cols-[1fr_auto]", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
          style={{ transitionDelay: "600ms" }}
        >
          {/* Language distribution */}
          <div className="rounded-[20px] border border-white/[0.06] bg-surface-low p-5">
            <p className="font-label-ui mb-4 text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
              {content.languagesLabel ?? "Language Distribution"}
            </p>
            <LanguageBars inView={inView} languages={languages} />
          </div>

          {/* Commit activity */}
          {activity.length > 0 && (
            <div className="rounded-[20px] border border-white/[0.06] bg-surface-low p-5 sm:min-w-[260px]">
              <p className="font-label-ui mb-3 text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
                {content.activityLabel ?? "Commit Activity · 30d"}
              </p>
              <ActivityBars activity={activity} />
              {totalCommits > 0 && (
                <p className="mt-2 font-label-ui text-[10px] text-foreground-muted/50">
                  {totalCommits} {content.commitsLabel ?? "commits"}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
