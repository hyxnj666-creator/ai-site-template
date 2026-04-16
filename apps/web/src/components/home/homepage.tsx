"use client";

import Link from "next/link";
import { homeContentByLocale, personalProfiles } from "@ai-site/content";
import {
  FeatureCard,
  GlassPanel,
  HeroTitle,
  MetricTile,
  PortalCard,
  PromptPanel,
  SectionHeading,
  SignalBar,
  SignalLine,
  SignalPill,
  StatusChip,
  SurfaceCard,
  TerminalPanel,
  accentDotClassNames,
  accentGlowClassNames,
  accentTextClassNames,
  buttonClassName,
} from "@ai-site/ui";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useLocalizedValue } from "../locale-provider";
import { useHomeTour } from "../tour/home-tour";
import { CodingDnaVisualizer } from "./coding-dna-visualizer";
import { useVisitorCounter } from "@/hooks/use-visitor-counter";
import { useInView } from "@/hooks/use-in-view";
import { MagneticWrap, StaggerGroup, StaggerItem } from "../motion-primitives";

type HomeContent = (typeof homeContentByLocale)["en"];

function tourSectionClassName(baseClassName: string, isActive: boolean) {
  return [
    baseClassName,
    "scroll-mt-28 transition-all duration-500",
    isActive
      ? "relative z-20 rounded-[36px] ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(208,188,255,0.18),0_0_90px_-28px_rgba(208,188,255,0.34)]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function HomePage() {
  const homeContent = useLocalizedValue(homeContentByLocale);
  const personalProfile = useLocalizedValue(personalProfiles);
  const { activeTargetId, tourUi } = useHomeTour();

  return (
    <main className="flex-1">
      {tourUi}
      <HeroSection
        hero={homeContent.hero}
        isActive={activeTargetId === "hero"}
        profileName={personalProfile.name}
      />
      <CapabilitiesSection
        capabilities={homeContent.capabilities}
        isActive={activeTargetId === "capabilities"}
      />
      <CodingDnaSection
        codingDna={homeContent.codingDna}
        isActive={activeTargetId === "coding-dna"}
      />
      <EvolutionPulseSection
        evolutionPulse={homeContent.evolutionPulse}
        isActive={activeTargetId === "evolution-pulse"}
      />
      <ExploreSection
        explore={homeContent.explore}
        isActive={activeTargetId === "explore"}
      />
      <PortalSection
        isActive={activeTargetId === "portals"}
        portals={homeContent.portals}
        portalsSection={homeContent.portalsSection}
      />
    </main>
  );
}

// LiveCounter: animates from old value to new value whenever `to` changes
function LiveCounter({ to }: { to: number }) {
  const [display, setDisplay] = useState(to);
  const prevRef = useRef(to);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    if (from === to) return;
    prevRef.current = to;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const duration = 600;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [to]);

  return <>{display}</>;
}

function HeroMetrics({ hero }: { hero: HomeContent["hero"] }) {
  const { online, chats } = useVisitorCounter();

  return (
    <div className="animate-fade-up mt-10 space-y-3" style={{ animationDelay: "460ms" }}>
      <div className="flex flex-wrap gap-3">
        {hero.metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2">
            <span className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">{m.label}</span>
            <span className="font-display-ui text-xs font-semibold tracking-[-0.02em] text-foreground">{m.value}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
          <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">
            {hero.liveOnlineLabel}
          </p>
          <p className="animate-number-glow font-display-ui mt-2 flex items-center gap-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
            <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400" />
            <LiveCounter to={online} />
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
          <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">
            {hero.liveChatsLabel}
          </p>
          <p className="animate-number-glow font-display-ui mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
            <LiveCounter to={chats} />
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  hero,
  isActive,
  profileName,
}: {
  hero: HomeContent["hero"];
  isActive: boolean;
  profileName: string;
}) {
  return (
    <section
      className={tourSectionClassName(
        "relative overflow-hidden px-4 pb-20 pt-32 md:px-6 md:pb-28 md:pt-40",
        isActive,
      )}
      id="hero"
    >
      <div className="pointer-events-none absolute left-[8%] top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[10%] top-40 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-tertiary/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-screen-2xl gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:items-end">
        <div>
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <StatusChip tone="secondary">{hero.eyebrow}</StatusChip>
          </div>
          <div className="mt-8">
            <p className="animate-fade-up text-sm uppercase tracking-[0.28em] text-foreground-muted" style={{ animationDelay: "80ms" }}>
              {profileName}
            </p>
            <HeroTitle className="animate-fade-up relative mt-4" style={{ animationDelay: "140ms" } as CSSProperties}>
              YOUR NAME
            </HeroTitle>
            <p
              className="font-display-ui animate-fade-up mt-6 max-w-3xl text-2xl font-medium leading-tight tracking-[-0.04em] text-foreground md:text-4xl"
              style={{ animationDelay: "220ms" }}
            >
              {hero.title}
            </p>
            <p
              className="animate-fade-up mt-6 max-w-2xl text-base leading-8 text-foreground-muted md:text-lg"
              style={{ animationDelay: "300ms" }}
            >
              {hero.description}
            </p>
          </div>

          <div className="animate-fade-up mt-10 flex flex-col gap-4 sm:flex-row" style={{ animationDelay: "380ms" }}>
            <MagneticWrap>
              <Link className={buttonClassName()} href={hero.primaryCta.href}>
                {hero.primaryCta.label}
              </Link>
            </MagneticWrap>
            <MagneticWrap>
              <Link
                className={buttonClassName({ variant: "secondary" })}
                href={hero.secondaryCta.href}
              >
                {hero.secondaryCta.label}
              </Link>
            </MagneticWrap>
          </div>

          <HeroMetrics hero={hero} />
        </div>

        <GlassPanel
          className="animate-scale-in relative overflow-hidden rounded-[28px] p-6 md:p-8"
          style={{ animationDelay: "200ms" } as CSSProperties}
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />
          <div className="pointer-events-none absolute -right-16 top-12 h-40 w-40 rounded-full bg-primary/[0.16] blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-2 h-32 w-32 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <span className="animate-heartbeat h-2 w-2 rounded-full bg-primary" />
              <p className="font-label-ui text-[10px] uppercase tracking-[0.2em] text-foreground-muted">{hero.statusLabel}</p>
            </div>
            <h2 className="font-display-ui mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {hero.overlayTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-foreground-muted">
              {hero.overlayDescription}
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 transition-colors hover:border-primary/20">
                <p className="font-label-ui text-[11px] uppercase tracking-[0.2em] text-primary">
                  {hero.insights.personaLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {hero.insights.personaValue}
                </p>
              </div>
              <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-4 transition-colors hover:border-secondary/20">
                <p className="font-label-ui text-[11px] uppercase tracking-[0.2em] text-secondary">
                  {hero.insights.focusLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {hero.insights.focusValue}
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}

function CapabilitiesSection({
  capabilities,
  isActive,
}: {
  capabilities: HomeContent["capabilities"];
  isActive: boolean;
}) {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={tourSectionClassName(
        "mx-auto w-full max-w-screen-2xl px-4 py-24 md:px-6",
        isActive,
      )}
      id="capabilities"
    >
      <div className={["scroll-reveal transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"].join(" ")}>
        <SectionHeading
          description={capabilities.description}
          eyebrow={capabilities.eyebrow}
          title={capabilities.title}
        />
      </div>

      <div className="scroll-reveal-slow mt-14 grid gap-6 md:grid-cols-12">
        <SurfaceCard
          className="md:col-span-7 md:min-h-[520px]"
          padding="xl"
          radius="lg"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">
                {capabilities.primaryCard.eyebrow}
              </p>
              <h3 className="font-display-ui mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                {capabilities.primaryCard.title}
              </h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-foreground-muted">
                {capabilities.primaryCard.description}
              </p>
            </div>

            <div className="grid gap-3">
              {capabilities.primaryCard.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-2xl bg-white/[0.04] px-4 py-4 text-sm leading-7 text-foreground-muted"
                >
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="md:col-span-5" padding="lg" radius="lg">
          <p className="text-xs uppercase tracking-[0.24em] text-secondary">
            {capabilities.secondaryCard.eyebrow}
          </p>
          <h3 className="font-display-ui mt-4 text-3xl font-semibold tracking-[-0.04em]">
            {capabilities.secondaryCard.title}
          </h3>
          <p className="mt-4 text-base leading-7 text-foreground-muted">
            {capabilities.secondaryCard.description}
          </p>
          <div className="mt-10 grid gap-4">
            {capabilities.secondaryCard.bars.map((bar, index) => (
              <SignalBar
                key={`${bar}-${index}`}
                accent="secondary"
                label={`${capabilities.secondaryCard.nodeLabel} ${index + 1}`}
                value={bar}
              />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="md:col-span-5" padding="lg" radius="lg">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">
            {capabilities.knowledgeCard.eyebrow}
          </p>
          <h3 className="font-display-ui mt-4 text-3xl font-semibold tracking-[-0.04em]">
            {capabilities.knowledgeCard.title}
          </h3>
          <p className="mt-4 text-base leading-7 text-foreground-muted">
            {capabilities.knowledgeCard.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {capabilities.knowledgeCard.tags.map((tag) => (
              <SignalPill
                accent="primary"
                key={tag}
              >
                {tag}
              </SignalPill>
            ))}
          </div>
        </SurfaceCard>

        <StaggerGroup className="grid gap-6 md:col-span-7 md:grid-cols-3">
          {capabilities.utilityCards.map((card) => (
            <StaggerItem key={card.title}>
              <FeatureCard
                accent={card.accent}
                className="h-full"
                description={card.description}
                eyebrow={card.eyebrow}
                interactive
                title={card.title}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function CodingDnaSection({
  codingDna,
  isActive,
}: {
  codingDna: HomeContent["codingDna"];
  isActive: boolean;
}) {
  return (
    <section
      className={tourSectionClassName("bg-surface-lowest py-24", isActive)}
      id="coding-dna"
    >
      <div className="scroll-reveal mx-auto w-full max-w-screen-2xl px-4 md:px-6">
        <CodingDnaVisualizer content={codingDna} />
      </div>
    </section>
  );
}

function EvolutionPulseSection({
  evolutionPulse,
  isActive,
}: {
  evolutionPulse: HomeContent["evolutionPulse"];
  isActive: boolean;
}) {
  const { ref, inView } = useInView(0.2);

  return (
    <section
      className={tourSectionClassName(
        "mx-auto w-full max-w-screen-2xl px-4 py-24 md:px-6",
        isActive,
      )}
      id="evolution-pulse"
    >
      <div
        className={["scroll-reveal flex flex-col gap-4 transition-all duration-700 md:flex-row md:items-center md:justify-between", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
        ref={ref}
      >
        <SectionHeading
          eyebrow={evolutionPulse.eyebrow}
          title={evolutionPulse.title}
        />
        <StatusChip tone="secondary">{evolutionPulse.uptime}</StatusChip>
      </div>

      {/* ── Desktop: horizontal timeline ── */}
      <div className="relative mt-16 hidden overflow-hidden rounded-[32px] bg-surface-low px-6 py-36 md:block md:px-10 md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(208,188,255,0.04),transparent_70%)]" />

        <SignalLine accent="primary" className="absolute left-8 right-8 top-1/2 -translate-y-1/2" />

        {inView && (
          <div
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(208,188,255,0.9)]"
            style={{ animation: "rail-travel 5s ease-in-out infinite" }}
          />
        )}

        {evolutionPulse.events.map((event, i) => {
          const total = evolutionPulse.events.length;
          const isAbove = i % 2 === 1;
          const cardTranslate =
            i === 0 ? "-translate-x-[10%]"
            : i === total - 1 ? "-translate-x-[90%]"
            : "-translate-x-1/2";

          const ARRIVAL_FRACTIONS = [0, 0.22, 0.46, 0.70, 0.93];
          const arrivalTime = (ARRIVAL_FRACTIONS[i] ?? 0) * 5;
          const activateDelay = arrivalTime - 5;

          return (
            <div
              key={`${event.date}-${event.title}`}
              className={[
                "group absolute top-1/2 transition-all duration-500",
                inView ? "opacity-100" : "opacity-0",
              ].join(" ")}
              style={{ left: event.offset, transitionDelay: `${i * 80}ms` }}
            >
              <div className="relative h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2">
                <div
                  className={[
                    "h-3.5 w-3.5 rounded-full group-hover:scale-125",
                    accentDotClassNames[event.accent],
                  ].join(" ")}
                  style={inView ? {
                    animation: "node-activate 5s ease-in-out infinite",
                    animationDelay: `${activateDelay}s`,
                  } : undefined}
                />
              </div>

              <div
                className={[
                  "absolute left-1/2 w-px -translate-x-1/2",
                  isAbove ? "bottom-full mb-0 h-4" : "top-full mt-0 h-4",
                  `bg-gradient-to-b ${accentGlowClassNames[event.accent]}`,
                  "opacity-30 group-hover:opacity-60 transition-opacity duration-300",
                ].join(" ")}
                style={isAbove ? { bottom: "7px" } : { top: "7px" }}
              />

              <div
                className={[
                  "absolute w-52 transition-all duration-300",
                  cardTranslate,
                  isAbove ? "bottom-10" : "top-10",
                  "md:opacity-60 md:group-hover:opacity-100",
                  isAbove ? "md:group-hover:translate-y-0.5" : "md:group-hover:-translate-y-0.5",
                ].join(" ")}
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-shadow duration-300 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <div
                    className={[
                      "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                      event.accent === "primary" ? "via-primary/30"
                        : event.accent === "secondary" ? "via-secondary/30"
                        : "via-tertiary/30",
                    ].join(" ")}
                  />
                  <div className="flex items-center gap-2">
                    <div className={["h-1 w-1 rounded-full shrink-0", accentDotClassNames[event.accent]].join(" ")} />
                    <p
                      className={[
                        "font-label-ui text-[10px] uppercase tracking-[0.22em]",
                        accentTextClassNames[event.accent],
                      ].join(" ")}
                    >
                      {event.date}
                    </p>
                  </div>
                  <p className="font-display-ui mt-2.5 text-[13px] font-semibold leading-5 tracking-[-0.02em]">
                    {event.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-6" />
      </div>

      {/* ── Mobile: vertical timeline ── */}
      <div className="relative mt-10 rounded-[24px] bg-surface-low px-5 py-8 md:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(208,188,255,0.04),transparent_70%)]" />

        <div className="absolute bottom-8 left-7 top-8 w-px bg-gradient-to-b from-primary/30 via-secondary/20 to-transparent" />

        <div className="flex flex-col gap-6">
          {evolutionPulse.events.map((event, i) => (
            <div
              key={`m-${event.date}-${event.title}`}
              className={[
                "relative pl-10 transition-all duration-500",
                inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3",
              ].join(" ")}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={["absolute left-[22px] top-2 h-3 w-3 rounded-full ring-2 ring-surface-low", accentDotClassNames[event.accent]].join(" ")} />
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className={["h-1 w-1 shrink-0 rounded-full", accentDotClassNames[event.accent]].join(" ")} />
                  <p className={["font-label-ui text-[10px] uppercase tracking-[0.22em]", accentTextClassNames[event.accent]].join(" ")}>
                    {event.date}
                  </p>
                </div>
                <p className="font-display-ui mt-2 text-[13px] font-semibold leading-5 tracking-[-0.02em]">
                  {event.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA — navigate to full evolution log */}
      <div className="mt-6 flex justify-end">
        <Link
          href="/evolution"
          className="group inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-5 py-2.5 font-label-ui text-[11px] uppercase tracking-[0.2em] text-secondary transition-all duration-200 hover:border-secondary/40 hover:bg-secondary/10"
        >
          {evolutionPulse.viewAllLabel}
        </Link>
      </div>
    </section>
  );
}

function ExploreSection({
  explore,
  isActive,
}: {
  explore: HomeContent["explore"];
  isActive: boolean;
}) {
  return (
    <section
      className={tourSectionClassName("bg-surface-low py-24", isActive)}
      id="explore"
    >
      <div className="scroll-reveal mx-auto grid w-full max-w-screen-2xl gap-12 px-4 md:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)] lg:items-center">
        <div>
          <SectionHeading
            description={explore.description}
            eyebrow={explore.eyebrow}
            title={explore.title}
          />
          <div className="mt-10 grid gap-4">
            {explore.modes.map((mode) => (
              <div
                key={mode.title}
                className="rounded-[28px] bg-black/20 px-6 py-6 transition-all duration-300 hover:bg-black/25"
              >
                <p
                  className={[
                    "text-xs uppercase tracking-[0.24em]",
                    accentTextClassNames[mode.accent],
                  ].join(" ")}
                >
                  {mode.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">
                  {mode.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -left-10 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

          <SurfaceCard
            className="bg-surface-lowest p-6 md:p-8"
            padding="none"
            radius="lg"
          >
            <PromptPanel
              items={explore.promptExamples.map((prompt, index) => ({
                highlighted: index === 0,
                label: prompt,
              }))}
              label={explore.inputLabel}
            />

            <TerminalPanel
              className="relative mt-4 w-full md:absolute md:right-0 md:top-20 md:z-10 md:w-[78%] md:max-w-sm md:rotate-[-5deg]"
              lines={explore.terminalLines}
            />

            <div className="hidden h-60 md:block md:h-72" />
          </SurfaceCard>
        </div>
      </div>
    </section>
  );
}

function PortalSection({
  isActive,
  portalsSection,
  portals,
}: {
  isActive: boolean;
  portalsSection: HomeContent["portalsSection"];
  portals: HomeContent["portals"];
}) {
  return (
    <section
      className={tourSectionClassName(
        "mx-auto w-full max-w-screen-2xl px-4 py-24 md:px-6",
        isActive,
      )}
      id="portals"
    >
      <div className="scroll-reveal">
        <SectionHeading
          align="center"
          description={portalsSection.description}
          eyebrow={portalsSection.eyebrow}
          title={portalsSection.title}
        />
      </div>

      <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
        {portals.map((portal) => (
          <StaggerItem key={portal.title} className="h-full">
            <MagneticWrap strength={0.12} className="h-full">
              <PortalCard
                accent={portal.accent}
                className="h-full"
                cta={portal.cta}
                description={portal.description}
                eyebrow={portal.eyebrow}
                href={portal.href}
                rel="noreferrer"
                target="_blank"
                title={portal.title}
              />
            </MagneticWrap>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
