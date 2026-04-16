"use client";

import { type LocalizedValue, platformPagesByLocale } from "@ai-site/content";
import { SignalPill, SurfaceCard, accentTextClassNames } from "@ai-site/ui";
import { useEffect, useState } from "react";
import { useLocalizedValue } from "../locale-provider";
import { useInView } from "@/hooks/use-in-view";
import { ChevronDown } from "lucide-react";
import {
  AccentEyebrow,
  OutlineHeroWord,
  accentBorderClassNames,
  accentSurfaceClassNames,
} from "../ai-pages/shared";

const evolutionLogCopyByLocale: LocalizedValue<{
  timelineLabel: string;
  skillsLabel: string;
  filterAll: string;
  expandHint: string;
  categoryLabels: Record<string, string>;
}> = {
  zh: {
    timelineLabel: "演化时间线",
    skillsLabel: "技术能力分布",
    filterAll: "全部",
    expandHint: "点击展开",
    categoryLabels: {
      All: "全部",
      Frontend: "前端",
      Backend: "后端",
      "AI/ML": "AI / ML",
      Infra: "基础设施",
    },
  },
  en: {
    timelineLabel: "Timeline",
    skillsLabel: "Tech Skills",
    filterAll: "All",
    expandHint: "Click to expand",
    categoryLabels: {
      All: "All",
      Frontend: "Frontend",
      Backend: "Backend",
      "AI/ML": "AI / ML",
      Infra: "Infra",
    },
  },
};

// Tech skills data
const TECH_SKILLS = [
  // Category: Frontend
  { name: "TypeScript", level: 95, category: "Frontend", color: "#3178c6" },
  { name: "React", level: 92, category: "Frontend", color: "#61dafb" },
  { name: "Next.js", level: 90, category: "Frontend", color: "#ffffff" },
  { name: "CSS / Tailwind", level: 88, category: "Frontend", color: "#38bdf8" },
  // Category: Backend
  { name: "Node.js", level: 85, category: "Backend", color: "#68a063" },
  { name: "Python", level: 78, category: "Backend", color: "#3572a5" },
  { name: "PostgreSQL", level: 72, category: "Backend", color: "#336791" },
  { name: "Redis", level: 65, category: "Backend", color: "#dc382d" },
  // Category: AI/ML
  { name: "LLM / OpenAI", level: 90, category: "AI/ML", color: "#74aa9c" },
  { name: "RAG / Embeddings", level: 82, category: "AI/ML", color: "#a855f7" },
  { name: "AI Agents", level: 78, category: "AI/ML", color: "#c084fc" },
  { name: "MCP / Tool Use", level: 75, category: "AI/ML", color: "#8b5cf6" },
  // Category: Infrastructure
  { name: "Docker", level: 70, category: "Infra", color: "#2496ed" },
  { name: "Nginx / PM2", level: 68, category: "Infra", color: "#009639" },
  { name: "Git / CI", level: 88, category: "Infra", color: "#f05033" },
];

const SKILL_CATEGORIES = ["All", "Frontend", "Backend", "AI/ML", "Infra"];
const CATEGORY_COLORS: Record<string, string> = {
  Frontend: "#3178c6",
  Backend: "#68a063",
  "AI/ML": "#a855f7",
  Infra: "#f59e0b",
};


function SkillsPanel({ copy }: { copy: { filterAll: string; categoryLabels: Record<string, string> } }) {
  const { ref, inView } = useInView(0.1);
  const [selectedCat, setSelectedCat] = useState("All");

  const filtered = TECH_SKILLS.filter(
    (s) => selectedCat === "All" || s.category === selectedCat,
  );

  return (
    <div ref={ref}>
      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {SKILL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={[
              "rounded-full px-4 py-1.5 font-label-ui text-[11px] uppercase tracking-[0.2em] transition-all duration-200",
              selectedCat === cat
                ? "bg-primary/15 text-primary border border-primary/20"
                : "border border-white/[0.06] bg-white/[0.03] text-foreground-muted hover:border-white/10 hover:text-foreground",
            ].join(" ")}
            type="button"
          >
            {copy.categoryLabels[cat] ?? cat}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((skill, i) => (
          <div
            key={skill.name}
            className={[
              "rounded-[16px] border border-white/[0.06] bg-surface-low p-4 transition-all duration-700",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            ].join(" ")}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: skill.color }}
                />
                <span className="font-label-ui text-[12px] font-medium tracking-[-0.01em]">
                  {skill.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-label-ui text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: CATEGORY_COLORS[skill.category] ?? "#888" }}
                >
                  {copy.categoryLabels[skill.category] ?? skill.category}
                </span>
                <span className="font-label-ui text-[11px] text-foreground-muted">
                  {skill.level}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: inView ? `${skill.level}%` : "0%",
                  background: skill.color,
                  transitionDelay: `${i * 50 + 200}ms`,
                  boxShadow: `0 0 8px ${skill.color}60`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  item,
  index,
  isLast,
  expandHint,
}: {
  item: { accent: "primary" | "secondary" | "tertiary"; date: string; description: string; title: string };
  index: number;
  isLast: boolean;
  expandHint: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { ref, inView } = useInView(0.1);

  const accentColor = item.accent === "primary" ? "#d0bcff" : item.accent === "secondary" ? "#94e2d5" : "#cba6f7";

  return (
    <div
      ref={ref}
      className={[
        "grid gap-4 md:grid-cols-[140px_minmax(0,1fr)] transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
      ].join(" ")}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="pt-4">
        <SignalPill accent={item.accent}>{item.date}</SignalPill>
      </div>
      <div className="relative">
        {!isLast ? (
          <div
            className="absolute left-[11px] top-10 h-[calc(100%+1.5rem)] w-px"
            style={{
              background: `linear-gradient(to bottom, ${accentColor}40, transparent)`,
            }}
          />
        ) : null}

        {/* Node */}
        <div className="absolute left-0 top-3 h-[22px] w-[22px] rounded-full border border-white/[0.08] bg-surface" />
        <div
          className="absolute left-[5px] top-[17px] h-3 w-3 rounded-full transition-all duration-300"
          style={{
            background: accentColor,
            boxShadow: expanded ? `0 0 12px ${accentColor}80` : "none",
          }}
        />

        {/* Card */}
        <SurfaceCard
          className={[
            "ml-10 cursor-pointer transition-all duration-300",
            expanded ? "border-opacity-30" : "",
            item.accent === "primary"
              ? "hover:border-primary/20"
              : item.accent === "secondary"
                ? "hover:border-secondary/20"
                : "hover:border-tertiary/20",
          ].join(" ")}
          padding="lg"
          radius="md"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display-ui text-xl font-semibold tracking-[-0.04em] md:text-2xl">
              {item.title}
            </h3>
            <button
              className={[
                "mt-1 shrink-0 rounded-full p-1 transition-all duration-200",
                expanded ? "rotate-180 text-foreground" : "text-foreground-muted",
              ].join(" ")}
              type="button"
            >
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <div
            className={[
              "overflow-hidden transition-all duration-400",
              expanded ? "max-h-40 mt-3" : "max-h-0",
            ].join(" ")}
          >
            <p className="text-sm leading-7 text-foreground-muted">
              {item.description}
            </p>
          </div>
          {!expanded && (
            <p className="mt-2 text-[11px] text-foreground-muted/50 font-label-ui uppercase tracking-[0.16em]">
              {expandHint} ↓
            </p>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}

export function EvolutionLogPage() {
  const content = useLocalizedValue(platformPagesByLocale).evolution;
  const copy = useLocalizedValue(evolutionLogCopyByLocale);

  return (
    <main className="relative overflow-hidden px-6 pb-24 pt-16 md:px-10">
      <div className="pointer-events-none absolute left-[4%] top-0 h-72 w-72 rounded-full bg-primary/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-[8%] top-32 h-80 w-80 rounded-full bg-secondary/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-32 left-1/3 h-64 w-64 rounded-full bg-tertiary/8 blur-[120px]" />

      {/* Hero */}
      <section className="relative">
        <AccentEyebrow accent="primary">{content.hero.eyebrow}</AccentEyebrow>
        <div className="mt-6 flex flex-col gap-6">
          <OutlineHeroWord word="EVOLUTION" />
          <h1 className="font-display-ui max-w-4xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            {content.hero.title}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-foreground-muted">
            {content.hero.description}
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="mt-20 grid gap-6 md:grid-cols-3">
        {content.pillars.map((pillar, i) => (
          <SurfaceCard
            className={[accentBorderClassNames[pillar.accent], "transition-all duration-700"].join(" ")}
            key={pillar.title}
            padding="lg"
            radius="md"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div
              className={[
                "inline-flex rounded-full px-3 py-1 font-label-ui text-[10px] uppercase tracking-[0.22em]",
                accentSurfaceClassNames[pillar.accent],
                accentTextClassNames[pillar.accent],
              ].join(" ")}
            >
              {pillar.eyebrow}
            </div>
            <h2 className="font-display-ui mt-4 text-2xl font-semibold tracking-[-0.04em]">
              {pillar.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-foreground-muted">
              {pillar.description}
            </p>
          </SurfaceCard>
        ))}
      </section>

      {/* Tech Skills */}
      <section className="mt-24">
        <div className="mb-10 flex items-center gap-4">
          <AccentEyebrow accent="tertiary">{copy.skillsLabel}</AccentEyebrow>
          <div className="h-px flex-1 bg-gradient-to-r from-tertiary/30 to-transparent" />
        </div>
        <SkillsPanel copy={copy} />
      </section>

      {/* Timeline */}
      <section className="mt-24">
        <div className="mb-10 flex items-center gap-4">
          <AccentEyebrow accent="secondary">{copy.timelineLabel}</AccentEyebrow>
          <div className="h-px flex-1 bg-gradient-to-r from-secondary/30 to-transparent" />
        </div>

        <div className="grid gap-6">
          {content.timeline.map((item, index) => (
            <TimelineItem
              key={`${item.date}-${item.title}`}
              expandHint={copy.expandHint}
              index={index}
              isLast={index === content.timeline.length - 1}
              item={item}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
