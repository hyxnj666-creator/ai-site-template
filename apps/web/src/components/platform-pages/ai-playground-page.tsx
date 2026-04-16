"use client";

import { type LocalizedValue, platformPagesByLocale } from "@ai-site/content";
import {
  MetricTile,
  PromptPanel,
  SignalPill,
  SurfaceCard,
  TerminalPanel,
  accentTextClassNames,
  buttonClassName,
} from "@ai-site/ui";
import Link from "next/link";
import { useLocalizedValue } from "../locale-provider";
import { AccentEyebrow, accentBorderClassNames, accentSurfaceClassNames } from "../ai-pages/shared";

const aiPlaygroundCopyByLocale: LocalizedValue<{
  surfacesEyebrow: string;
  surfacesTitle: string;
}> = {
  zh: {
    surfacesEyebrow: "AI 分层界面",
    surfacesTitle: "按问题类型进入最合适的智能界面",
  },
  en: {
    surfacesEyebrow: "AI Surfaces",
    surfacesTitle: "Pick the interface that matches the question",
  },
};

export function AiPlaygroundPage() {
  const content = useLocalizedValue(platformPagesByLocale).aiHub;
  const copy = useLocalizedValue(aiPlaygroundCopyByLocale);

  return (
    <main className="relative overflow-hidden px-6 pb-24 pt-10 md:px-10">
      <div className="pointer-events-none absolute left-[8%] top-16 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[8%] top-28 h-80 w-80 rounded-full bg-secondary/10 blur-[140px]" />

      <section className="relative">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1fr)] lg:items-center">
          <div>
            <AccentEyebrow accent="primary">{content.hero.status}</AccentEyebrow>
            <h1 className="font-display-ui mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.06em] md:text-7xl">
              {content.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-muted">
              {content.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {content.metrics.map((metric) => (
                <SignalPill accent={metric.accent} key={metric.label}>
                  {metric.label}: {metric.value}
                </SignalPill>
              ))}
            </div>

            <div className="mt-10">
              <Link className={buttonClassName()} href="/ai/chat">
                {content.hero.ctaLabel}
              </Link>
            </div>
          </div>

          <div className="relative">
            <SurfaceCard className="bg-surface-lowest p-6 md:p-8" padding="none" radius="lg">
              <PromptPanel
                items={content.hero.promptExamples.map((label, index) => ({
                  accent: index === 1 ? "secondary" : "primary",
                  highlighted: index === 0,
                  label,
                }))}
                label={content.hero.inputLabel}
              />

              <TerminalPanel
                className="absolute right-0 top-24 z-10 w-[78%] max-w-sm rotate-[-5deg]"
                lines={content.hero.terminalLines}
              />

              <div className="h-60 md:h-72" />
            </SurfaceCard>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {content.metrics.map((metric) => (
            <MetricTile
              accent={metric.accent}
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="mb-10">
          <AccentEyebrow accent="secondary">{copy.surfacesEyebrow}</AccentEyebrow>
          <h2 className="font-display-ui mt-4 text-4xl font-semibold tracking-[-0.05em]">
            {copy.surfacesTitle}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {content.modules.map((module) => (
            <Link className="group block" href={module.href} key={module.href}>
              <SurfaceCard
                className={[
                  "h-full transition-all duration-300 group-hover:-translate-y-1",
                  accentBorderClassNames[module.accent],
                ].join(" ")}
                padding="xl"
                radius="lg"
              >
                <div
                  className={[
                    "mb-5 inline-flex rounded-full px-3 py-1 font-label-ui text-[10px] uppercase tracking-[0.22em]",
                    accentSurfaceClassNames[module.accent],
                    accentTextClassNames[module.accent],
                  ].join(" ")}
                >
                  {module.eyebrow}
                </div>
                <h3 className="font-display-ui text-3xl font-semibold tracking-[-0.04em]">
                  {module.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-foreground-muted">
                  {module.description}
                </p>
                <div
                  className={[
                    "mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em]",
                    accentTextClassNames[module.accent],
                  ].join(" ")}
                >
                  <span>{module.cta}</span>
                  <span aria-hidden="true">→</span>
                </div>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
