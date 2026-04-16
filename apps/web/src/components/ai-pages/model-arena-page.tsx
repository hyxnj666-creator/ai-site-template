"use client";

import {
  type ArenaModelId,
  type ArenaScores,
  type ArenaStreamEvent,
  type ArenaVoteRecord,
  arenaModelLabels,
  arenaTemplates,
} from "@ai-site/ai";
import { type LocalizedValue } from "@ai-site/content";
import { GlassPanel, SignalPill } from "@ai-site/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalizedValue, useSiteLocale } from "../locale-provider";

/* ------------------------------------------------------------------ */
/*  i18n                                                               */
/* ------------------------------------------------------------------ */

interface ArenaCopy {
  eyebrow: string;
  placeholder: string;
  fight: string;
  fighting: string;
  speedLabel: string;
  voteTitle: string;
  hallTitle: string;
  hallDesc: string;
  hallEmpty: string;
  clear: string;
  thanks: string;
  readiness: string;
  leftTag: string;
  rightTag: string;
  blindLabel: string;
  openLabel: string;
  revealLabel: string;
  modelA: string;
  modelB: string;
  depth: string;
  clarity: string;
  creativity: string;
  submit: string;
  templateHint: string;
}

const copyByLocale: LocalizedValue<ArenaCopy> = {
  zh: {
    eyebrow: "MODEL ARENA",
    placeholder: "输入你的挑战...",
    fight: "FIGHT",
    fighting: "对决中...",
    speedLabel: "处理速度 (Token chunks)",
    voteTitle: "投出你的裁决",
    hallTitle: "Hall of Fame",
    hallDesc: "近期高强度对决",
    hallEmpty: "还没有对决记录，选择一个模板开始吧",
    clear: "清除",
    thanks: "评分已记录！",
    readiness: "选择一个挑战模板，或输入自定义问题。",
    leftTag: "Streaming active",
    rightTag: "Cognitive precision",
    blindLabel: "盲评",
    openLabel: "公开",
    revealLabel: "揭晓身份",
    modelA: "Model A",
    modelB: "Model B",
    depth: "深度",
    clarity: "清晰度",
    creativity: "创意",
    submit: "提交评分",
    templateHint: "试试这些挑战",
  },
  en: {
    eyebrow: "MODEL ARENA",
    placeholder: "Enter your challenge...",
    fight: "FIGHT",
    fighting: "Fighting...",
    speedLabel: "Processing Speed (Token chunks)",
    voteTitle: "Cast your verdict",
    hallTitle: "Hall of Fame",
    hallDesc: "Recent high-stake encounters",
    hallEmpty: "No battles yet. Pick a template to start!",
    clear: "Clear",
    thanks: "Scores recorded!",
    readiness: "Pick a challenge template, or type your own.",
    leftTag: "Streaming active",
    rightTag: "Cognitive precision",
    blindLabel: "Blind",
    openLabel: "Open",
    revealLabel: "Reveal Models",
    modelA: "Model A",
    modelB: "Model B",
    depth: "Depth",
    clarity: "Clarity",
    creativity: "Creativity",
    submit: "Submit scores",
    templateHint: "Try these challenges",
  },
};

/* ------------------------------------------------------------------ */
/*  localStorage                                                       */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "ai-site-arena-votes";

function loadVotes(): ArenaVoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ArenaVoteRecord[]) : [];
  } catch {
    return [];
  }
}

function saveVotes(votes: ArenaVoteRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes.slice(0, 50)));
  } catch { /* noop */ }
}

/* ------------------------------------------------------------------ */
/*  Score dots                                                         */
/* ------------------------------------------------------------------ */

function ScoreRow({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent: "left" | "right";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="w-16 shrink-0 text-xs text-foreground-muted">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            className={[
              "h-7 w-7 rounded-full border text-xs font-semibold transition-all",
              n <= value
                ? accent === "left"
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-secondary bg-secondary/20 text-secondary"
                : "border-white/10 text-foreground-muted/40 hover:border-white/20",
            ].join(" ")}
            key={n}
            onClick={() => onChange(n)}
            type="button"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ModelArenaPage() {
  const copy = useLocalizedValue(copyByLocale);
  const { locale } = useSiteLocale();
  const loc = locale === "zh" ? "zh" : "en";

  const LEFT_MODEL: ArenaModelId = "gpt-5-mini";
  const RIGHT_MODEL: ArenaModelId = "claude-sonnet";

  const [prompt, setPrompt] = useState("");
  const [blindMode, setBlindMode] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [leftStreaming, setLeftStreaming] = useState(false);
  const [rightStreaming, setRightStreaming] = useState(false);
  const [leftDone, setLeftDone] = useState<{ latencyMs: number; tokenCount: number; mode: string } | null>(null);
  const [rightDone, setRightDone] = useState<{ latencyMs: number; tokenCount: number; mode: string } | null>(null);
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState<ArenaVoteRecord[]>([]);
  const [status, setStatus] = useState("");
  const [runError, setRunError] = useState<string | null>(null);

  const [leftScores, setLeftScores] = useState<ArenaScores>({ depth: 0, clarity: 0, creativity: 0 });
  const [rightScores, setRightScores] = useState<ArenaScores>({ depth: 0, clarity: 0, creativity: 0 });
  const [winner, setWinner] = useState<"left" | "right" | "tie" | null>(null);

  const currentPromptRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const battleRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const leftNetBufRef = useRef("");
  const rightNetBufRef = useRef("");
  const leftVisibleRef = useRef("");
  const rightVisibleRef = useRef("");
  const userScrolledRef = useRef(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runLeftModelRef = useRef<ArenaModelId>("gpt-5-mini");
  const runRightModelRef = useRef<ArenaModelId>("claude-sonnet");

  const TICK_MS = 16;

  useEffect(() => { setVotes(loadVotes()); }, []);

  function adaptiveChars(pending: number): number {
    if (pending > 300) return 6;
    if (pending > 120) return 3;
    if (pending > 40) return 2;
    return 1;
  }

  const startTypewriter = useCallback(() => {
    if (typewriterRef.current) return;
    typewriterRef.current = setInterval(() => {
      let dirty = false;
      const lp = leftNetBufRef.current.length - leftVisibleRef.current.length;
      if (lp > 0) {
        const n = adaptiveChars(lp);
        leftVisibleRef.current += leftNetBufRef.current.slice(leftVisibleRef.current.length, leftVisibleRef.current.length + n);
        setLeftText(leftVisibleRef.current);
        dirty = true;
      }
      const rp = rightNetBufRef.current.length - rightVisibleRef.current.length;
      if (rp > 0) {
        const n = adaptiveChars(rp);
        rightVisibleRef.current += rightNetBufRef.current.slice(rightVisibleRef.current.length, rightVisibleRef.current.length + n);
        setRightText(rightVisibleRef.current);
        dirty = true;
      }
      if (dirty && !userScrolledRef.current) {
        leftScrollRef.current && (leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight);
        rightScrollRef.current && (rightScrollRef.current.scrollTop = rightScrollRef.current.scrollHeight);
      }
      if (!dirty && lp <= 0 && rp <= 0) {
        if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
      }
    }, TICK_MS);
  }, []);

  useEffect(() => () => { if (typewriterRef.current) clearInterval(typewriterRef.current); }, []);

  const handleBattleScroll = useCallback(() => { userScrolledRef.current = true; }, []);

  const winStats = useMemo(() => {
    const left = votes.filter((v) => v.winner === "left").length;
    const right = votes.filter((v) => v.winner === "right").length;
    const tie = votes.filter((v) => v.winner === "tie").length;
    return { left, right, tie, total: votes.length };
  }, [votes]);

  const leftDisplayName = blindMode && !revealed ? copy.modelA : arenaModelLabels[runLeftModelRef.current];
  const rightDisplayName = blindMode && !revealed ? copy.modelB : arenaModelLabels[runRightModelRef.current];
  const leftInitials = blindMode && !revealed ? "A" : arenaModelLabels[runLeftModelRef.current].slice(0, 2).toUpperCase();
  const rightInitials = blindMode && !revealed ? "B" : arenaModelLabels[runRightModelRef.current].slice(0, 2).toUpperCase();

  /* ---- run ---- */

  const handleRun = useCallback(async () => {
    if (isRunning || !prompt.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    runLeftModelRef.current = LEFT_MODEL;
    runRightModelRef.current = RIGHT_MODEL;

    setIsRunning(true);
    setRunError(null);
    setLeftText(""); setRightText("");
    leftNetBufRef.current = ""; rightNetBufRef.current = "";
    leftVisibleRef.current = ""; rightVisibleRef.current = "";
    userScrolledRef.current = false;
    startTypewriter();
    setLeftStreaming(true); setRightStreaming(true);
    setLeftDone(null); setRightDone(null);
    setVoted(false); setRevealed(false);
    setLeftScores({ depth: 0, clarity: 0, creativity: 0 });
    setRightScores({ depth: 0, clarity: 0, creativity: 0 });
    setWinner(null);
    setStatus("");
    currentPromptRef.current = prompt.trim();

    setTimeout(() => battleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);

    try {
      const res = await fetch("/api/arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leftModel: LEFT_MODEL, rightModel: RIGHT_MODEL, locale: loc, prompt: prompt.trim() }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);
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
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as ArenaStreamEvent;
            switch (event.type) {
              case "left_delta":
                leftNetBufRef.current += event.text;
                if (!typewriterRef.current) startTypewriter();
                break;
              case "right_delta":
                rightNetBufRef.current += event.text;
                if (!typewriterRef.current) startTypewriter();
                break;
              case "left_done":
                setLeftStreaming(false);
                setLeftDone({ latencyMs: event.latencyMs, tokenCount: event.tokenCount, mode: event.mode });
                break;
              case "right_done":
                setRightStreaming(false);
                setRightDone({ latencyMs: event.latencyMs, tokenCount: event.tokenCount, mode: event.mode });
                break;
              case "done":
                setIsRunning(false); setLeftStreaming(false); setRightStreaming(false);
                setStatus(event.summary);
                break;
              case "error":
                setIsRunning(false); setLeftStreaming(false); setRightStreaming(false);
                setStatus(event.message);
                break;
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error(err);
        setRunError(err instanceof Error ? err.message : "Battle failed. Please try again.");
      }
    } finally {
      setIsRunning(false); setLeftStreaming(false); setRightStreaming(false);
    }
  }, [isRunning, loc, prompt, startTypewriter]);

  /* ---- vote ---- */

  const handleSubmitVote = useCallback(() => {
    if (voted || !winner) return;
    setVoted(true);
    if (blindMode) setRevealed(true);
    const record: ArenaVoteRecord = {
      id: crypto.randomUUID(),
      prompt: currentPromptRef.current,
      leftModel: runLeftModelRef.current,
      rightModel: runRightModelRef.current,
      winner,
      leftLatencyMs: leftDone?.latencyMs ?? 0,
      rightLatencyMs: rightDone?.latencyMs ?? 0,
      leftScores: (leftScores.depth > 0 || leftScores.clarity > 0 || leftScores.creativity > 0) ? leftScores : undefined,
      rightScores: (rightScores.depth > 0 || rightScores.clarity > 0 || rightScores.creativity > 0) ? rightScores : undefined,
      timestamp: Date.now(),
    };
    const updated = [record, ...votes];
    setVotes(updated);
    saveVotes(updated);
  }, [blindMode, leftDone, leftScores, rightDone, rightScores, voted, votes, winner]);

  const hasOutput = isRunning || leftText.length > 0 || rightText.length > 0;
  const battleDone = !isRunning && (leftText.length > 0 || rightText.length > 0);

  const leftSpeed = leftDone ? (leftDone.latencyMs / 1000).toFixed(1) + "s" : "—";
  const rightSpeed = rightDone ? (rightDone.latencyMs / 1000).toFixed(1) + "s" : "—";
  const leftTokens = leftDone?.tokenCount ?? 0;
  const rightTokens = rightDone?.tokenCount ?? 0;
  const totalTokens = leftTokens + rightTokens || 1;

  return (
    <main className="relative overflow-x-hidden">
      {/* ============ Hero Section ============ */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24 md:px-10">
        <div className="pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-secondary/15 blur-[120px]" />

        <div className="relative z-10 w-full max-w-7xl">
          <div className="mb-6 flex items-center justify-center gap-4">
            <p className="font-display-ui text-xs font-black uppercase tracking-[0.4em] text-primary">
              {copy.eyebrow}
            </p>
            {/* Blind mode toggle */}
            <button
              className={[
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                blindMode
                  ? "border-tertiary/30 bg-tertiary/10 text-tertiary"
                  : "border-white/10 bg-white/5 text-foreground-muted",
              ].join(" ")}
              onClick={() => setBlindMode(!blindMode)}
              type="button"
            >
              {blindMode ? copy.blindLabel : copy.openLabel}
            </button>
          </div>

          {/* VS split hero cards with model selectors */}
          <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-0">
            <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center md:flex">
              <div className="relative">
                <p className="select-none font-display-ui text-[7rem] font-black italic text-white/10 md:text-[12rem]">VS</p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-display-ui text-5xl font-black italic tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] md:text-7xl">VS</p>
                </div>
              </div>
            </div>

            {/* Left */}
            <div className="group relative h-64 overflow-hidden rounded-2xl border-r border-white/5 md:h-96 md:rounded-l-2xl md:rounded-r-none">
              <div className="absolute inset-0 bg-cover bg-center opacity-30 grayscale transition-all duration-700 group-hover:opacity-50 group-hover:grayscale-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&q=60')" }} />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-primary/10 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h2 className="text-glow-primary font-display-ui text-4xl font-bold text-primary md:text-5xl">
                  {blindMode ? copy.modelA : arenaModelLabels[LEFT_MODEL]}
                </h2>
                <p className="mt-2 font-label-ui text-[10px] uppercase tracking-[0.24em] text-foreground-muted">
                  {blindMode ? "Challenger One" : "Speed & Efficiency"}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="group relative h-64 overflow-hidden rounded-2xl md:h-96 md:rounded-l-none md:rounded-r-2xl">
              <div className="absolute inset-0 bg-cover bg-center opacity-30 grayscale transition-all duration-700 group-hover:opacity-50 group-hover:grayscale-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&auto=format&q=60')" }} />
              <div className="absolute inset-0 bg-gradient-to-l from-background via-secondary/10 to-transparent" />
              <div className="absolute bottom-8 right-8 text-right">
                <h2 className="text-glow-secondary font-display-ui text-4xl font-bold text-secondary md:text-5xl">
                  {blindMode ? copy.modelB : arenaModelLabels[RIGHT_MODEL]}
                </h2>
                <p className="mt-2 font-label-ui text-[10px] uppercase tracking-[0.24em] text-foreground-muted">
                  {blindMode ? "Challenger Two" : "Cognitive Precision"}
                </p>
              </div>
            </div>
          </div>

          {/* Prompt templates */}
          <div className="mx-auto mt-8 max-w-3xl">
            <p className="mb-3 text-center text-[10px] uppercase tracking-widest text-foreground-muted/60">{copy.templateHint}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {arenaTemplates.map((t) => (
                <button
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs transition-all hover:-translate-y-0.5",
                    prompt === t.prompt[loc]
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-white/10 text-foreground-muted hover:border-white/20 hover:text-foreground",
                  ].join(" ")}
                  key={t.id}
                  onClick={() => setPrompt(t.prompt[loc])}
                  type="button"
                >
                  <span className="mr-1">{t.icon}</span>
                  {t.label[loc]}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="mx-auto mt-6 max-w-2xl">
            <div className="relative">
              <input
                className="w-full border-b border-white/[0.08] bg-surface-low px-6 py-5 pr-40 text-lg outline-none transition-colors placeholder:text-foreground-muted/40 focus:border-primary"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleRun(); } }}
                placeholder={copy.placeholder}
                type="text"
                value={prompt}
              />
              <button
                className={[
                  "absolute bottom-2 right-2 top-2 flex items-center gap-2 rounded-lg px-8 font-display-ui font-black transition-all",
                  isRunning
                    ? "cursor-not-allowed bg-white/5 text-foreground-muted"
                    : "bg-gradient-to-r from-primary to-primary/70 text-background hover:brightness-110 active:scale-95",
                ].join(" ")}
                disabled={isRunning || !prompt.trim()}
                onClick={() => void handleRun()}
                type="button"
              >
                {isRunning ? copy.fighting : copy.fight}
              </button>
            </div>
            <p className="mt-4 text-center font-label-ui text-[10px] uppercase tracking-[0.24em] text-foreground-muted">
              {status || copy.readiness}
            </p>
          </div>
        </div>
      </section>

      {/* ============ Error Banner ============ */}
      {runError && (
        <div className="mx-auto max-w-screen-2xl px-4 py-4 md:px-12">
          <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{runError}</p>
            <button className="ml-4 font-label-ui text-[10px] uppercase tracking-[0.15em] text-red-400/60 hover:text-red-400" onClick={() => setRunError(null)} type="button">✕</button>
          </div>
        </div>
      )}

      {/* ============ Battle Area ============ */}
      {hasOutput && (
        <section ref={battleRef} className="relative border-t border-white/5 bg-surface-lowest px-4 py-20 md:px-12">
          <div className="mx-auto max-w-screen-2xl">
            <div className="relative flex flex-col md:flex-row">
              <div className="absolute bottom-0 left-1/2 top-0 z-20 hidden w-px md:block" style={{ background: "linear-gradient(to bottom, transparent, var(--color-primary), var(--color-secondary), transparent)" }} />

              {/* Left */}
              <div className="flex-1 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent p-8 md:rounded-none md:pr-16">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <span className="font-display-ui text-sm font-bold text-primary">{leftInitials}</span>
                    </div>
                    <div>
                      <h3 className={["font-display-ui text-xl font-bold text-primary transition-all duration-500", blindMode && !revealed ? "blur-[3px]" : ""].join(" ")}>
                        {leftDisplayName}
                      </h3>
                      <span className="font-label-ui text-[10px] uppercase text-foreground-muted">
                        {leftStreaming ? copy.leftTag : leftDone?.mode === "live" ? "Complete" : "Fallback"}
                      </span>
                    </div>
                  </div>
                  {leftDone && <SignalPill accent="primary">{leftSpeed}</SignalPill>}
                  {leftStreaming && (
                    <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                      <span className="font-label-ui text-[10px] text-primary">streaming</span>
                    </div>
                  )}
                </div>
                <div ref={leftScrollRef} className="max-h-[500px] space-y-4 overflow-y-auto pr-4 leading-relaxed text-foreground-muted" onScroll={handleBattleScroll}>
                  {leftText.split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p className={i === 0 ? "text-lg text-foreground" : ""} key={i}>{p}</p>
                  ))}
                  {leftStreaming && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary" />}
                </div>
              </div>

              {/* Right */}
              <div className="mt-8 flex-1 rounded-2xl bg-gradient-to-bl from-secondary/5 to-transparent p-8 md:mt-0 md:rounded-none md:pl-16">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/10">
                      <span className="font-display-ui text-sm font-bold text-secondary">{rightInitials}</span>
                    </div>
                    <div>
                      <h3 className={["font-display-ui text-xl font-bold text-secondary transition-all duration-500", blindMode && !revealed ? "blur-[3px]" : ""].join(" ")}>
                        {rightDisplayName}
                      </h3>
                      <span className="font-label-ui text-[10px] uppercase text-foreground-muted">
                        {rightStreaming ? copy.rightTag : rightDone?.mode === "live" ? "Complete" : "Fallback"}
                      </span>
                    </div>
                  </div>
                  {rightDone && <SignalPill accent="secondary">{rightSpeed}</SignalPill>}
                  {rightStreaming && (
                    <div className="flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 shadow-[0_0_15px_rgba(93,230,255,0.15)]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                      <span className="font-label-ui text-[10px] text-secondary">streaming</span>
                    </div>
                  )}
                </div>
                <div ref={rightScrollRef} className="max-h-[500px] space-y-4 overflow-y-auto pr-4 leading-relaxed text-foreground-muted" onScroll={handleBattleScroll}>
                  {rightText.split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p className={i === 0 ? "text-lg text-foreground" : ""} key={i}>{p}</p>
                  ))}
                  {rightStreaming && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-secondary" />}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ Metrics ============ */}
      {battleDone && (
        <section className="px-4 py-12 md:px-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <span className="font-label-ui text-xs uppercase tracking-widest text-foreground-muted">{copy.speedLabel}</span>
                <div className="flex items-center gap-4">
                  <span className="font-display-ui font-bold text-primary">{leftTokens}</span>
                  <span className="text-foreground-muted/30">|</span>
                  <span className="font-display-ui font-bold text-secondary">{rightTokens}</span>
                </div>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-low">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(leftTokens / totalTokens) * 100}%` }} />
                <div className="h-full bg-secondary transition-all duration-700" style={{ width: `${(rightTokens / totalTokens) * 100}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div className="flex flex-col gap-1">
                <span className="font-label-ui text-[10px] uppercase text-foreground-muted">Latency</span>
                <span className="font-display-ui text-4xl font-bold tracking-tighter text-primary">{leftSpeed}</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="font-label-ui text-[10px] uppercase text-foreground-muted">Latency</span>
                <span className="font-display-ui text-4xl font-bold tracking-tighter text-secondary">{rightSpeed}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ Vote / Score Panel ============ */}
      {battleDone && (
        <section className="px-4 pb-20 md:px-10">
          <div className="mx-auto max-w-4xl">
            <GlassPanel className="rounded-[20px] border border-white/5 p-8">
              {voted ? (
                <div className="space-y-4 py-4 text-center">
                  <p className="font-display-ui text-lg font-semibold text-primary">{copy.thanks}</p>
                  {blindMode && revealed && (
                    <div className="flex items-center justify-center gap-6 pt-2">
                      <div className="text-center">
                        <p className="text-xs text-foreground-muted">{copy.modelA}</p>
                        <p className="font-display-ui text-lg font-bold text-primary">{arenaModelLabels[runLeftModelRef.current]}</p>
                      </div>
                      <span className="text-foreground-muted/30">vs</span>
                      <div className="text-center">
                        <p className="text-xs text-foreground-muted">{copy.modelB}</p>
                        <p className="font-display-ui text-lg font-bold text-secondary">{arenaModelLabels[runRightModelRef.current]}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h4 className="mb-6 text-center font-display-ui text-2xl font-bold uppercase tracking-tighter">{copy.voteTitle}</h4>

                  {/* Winner pick */}
                  <div className="mb-8 grid grid-cols-3 gap-3">
                    {(["left", "tie", "right"] as const).map((w) => {
                      const active = winner === w;
                      const cls = w === "left"
                        ? active ? "border-primary bg-primary/15 text-primary" : "border-primary/20 hover:bg-primary/5 text-primary/60"
                        : w === "right"
                          ? active ? "border-secondary bg-secondary/15 text-secondary" : "border-secondary/20 hover:bg-secondary/5 text-secondary/60"
                          : active ? "border-white/20 bg-white/10 text-foreground" : "border-white/10 hover:bg-white/5 text-foreground-muted";
                      const label = w === "left" ? `${leftDisplayName} Wins` : w === "right" ? `${rightDisplayName} Wins` : "Tie";
                      return (
                        <button
                          className={["rounded-xl border p-4 text-center text-sm font-semibold transition-all", cls].join(" ")}
                          key={w}
                          onClick={() => setWinner(w)}
                          type="button"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Multi-dimension scores */}
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-center text-xs font-semibold text-primary">{leftDisplayName}</p>
                      <ScoreRow accent="left" label={copy.depth} onChange={(v) => setLeftScores((s) => ({ ...s, depth: v }))} value={leftScores.depth} />
                      <ScoreRow accent="left" label={copy.clarity} onChange={(v) => setLeftScores((s) => ({ ...s, clarity: v }))} value={leftScores.clarity} />
                      <ScoreRow accent="left" label={copy.creativity} onChange={(v) => setLeftScores((s) => ({ ...s, creativity: v }))} value={leftScores.creativity} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-center text-xs font-semibold text-secondary">{rightDisplayName}</p>
                      <ScoreRow accent="right" label={copy.depth} onChange={(v) => setRightScores((s) => ({ ...s, depth: v }))} value={rightScores.depth} />
                      <ScoreRow accent="right" label={copy.clarity} onChange={(v) => setRightScores((s) => ({ ...s, clarity: v }))} value={rightScores.clarity} />
                      <ScoreRow accent="right" label={copy.creativity} onChange={(v) => setRightScores((s) => ({ ...s, creativity: v }))} value={rightScores.creativity} />
                    </div>
                  </div>

                  <button
                    className={[
                      "mt-8 w-full rounded-xl py-3 font-display-ui text-sm font-bold uppercase tracking-wider transition-all",
                      winner
                        ? "bg-gradient-to-r from-primary to-secondary text-background hover:brightness-110"
                        : "cursor-not-allowed bg-white/5 text-foreground-muted",
                    ].join(" ")}
                    disabled={!winner}
                    onClick={handleSubmitVote}
                    type="button"
                  >
                    {copy.submit}
                  </button>
                </>
              )}
            </GlassPanel>
          </div>
        </section>
      )}

      {/* ============ Hall of Fame ============ */}
      <section className="bg-surface-low px-4 py-20 md:px-12">
        <div className="mx-auto max-w-screen-2xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display-ui text-4xl font-black uppercase italic tracking-tighter">{copy.hallTitle}</h2>
              <p className="mt-2 font-label-ui text-xs uppercase tracking-[0.2em] text-foreground-muted">{copy.hallDesc}</p>
            </div>
            <div className="flex items-center gap-4">
              {winStats.total > 0 && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-primary">{winStats.left} Left</span>
                  <span className="text-foreground-muted/30">·</span>
                  <span className="text-foreground-muted">{winStats.tie} Tie</span>
                  <span className="text-foreground-muted/30">·</span>
                  <span className="text-secondary">{winStats.right} Right</span>
                </div>
              )}
              {votes.length > 0 && (
                <button className="font-label-ui text-xs text-foreground-muted transition-colors hover:text-red-400" onClick={() => { setVotes([]); saveVotes([]); }} type="button">
                  {copy.clear}
                </button>
              )}
            </div>
          </div>

          {/* Win rate bars */}
          {winStats.total > 0 && (
            <div className="mb-8 grid grid-cols-3 gap-4">
              {[
                { label: "Left Model", count: winStats.left, color: "primary" },
                { label: "Tie", count: winStats.tie, color: "muted" },
                { label: "Right Model", count: winStats.right, color: "secondary" },
              ].map((s) => (
                <div className="rounded-xl border border-white/5 bg-surface-lowest p-4 text-center" key={s.label}>
                  <div className="mx-auto mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={s.color === "primary" ? "h-full bg-primary" : s.color === "secondary" ? "h-full bg-secondary" : "h-full bg-foreground-muted/30"}
                      style={{ width: `${winStats.total > 0 ? (s.count / winStats.total) * 100 : 0}%`, transition: "width 0.5s" }}
                    />
                  </div>
                  <p className={["font-display-ui text-2xl font-bold", s.color === "primary" ? "text-primary" : s.color === "secondary" ? "text-secondary" : "text-foreground-muted"].join(" ")}>
                    {s.count}
                  </p>
                  <p className="text-[10px] uppercase text-foreground-muted">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {votes.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-surface-lowest p-12 text-center">
              <p className="text-sm text-foreground-muted">{copy.hallEmpty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-surface-lowest">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="font-label-ui text-[10px] uppercase tracking-widest text-foreground-muted">
                    <th className="px-6 py-4">Challenge</th>
                    <th className="px-6 py-4">Models</th>
                    <th className="px-6 py-4">Winner</th>
                    <th className="px-6 py-4">Scores</th>
                    <th className="px-6 py-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {votes.slice(0, 20).map((record) => {
                    const isLeft = record.winner === "left";
                    const isRight = record.winner === "right";
                    const lAvg = record.leftScores ? ((record.leftScores.depth + record.leftScores.clarity + record.leftScores.creativity) / 3).toFixed(1) : "—";
                    const rAvg = record.rightScores ? ((record.rightScores.depth + record.rightScores.clarity + record.rightScores.creativity) / 3).toFixed(1) : "—";

                    return (
                      <tr className="transition-colors hover:bg-white/[0.03]" key={record.id}>
                        <td className="px-6 py-5">
                          <p className="max-w-xs truncate font-medium text-foreground">{record.prompt}</p>
                        </td>
                        <td className="px-6 py-5 text-xs text-foreground-muted">
                          {arenaModelLabels[record.leftModel]} vs {arenaModelLabels[record.rightModel]}
                        </td>
                        <td className="px-6 py-5">
                          <span className={[
                            "rounded-full border px-3 py-1 font-display-ui text-xs font-bold italic tracking-tighter",
                            isLeft ? "border-primary/20 bg-primary/10 text-primary"
                              : isRight ? "border-secondary/20 bg-secondary/10 text-secondary"
                                : "border-white/10 bg-white/5 text-foreground-muted",
                          ].join(" ")}>
                            {isLeft ? arenaModelLabels[record.leftModel] : isRight ? arenaModelLabels[record.rightModel] : "TIE"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-foreground-muted">
                          <span className="text-primary">{lAvg}</span>
                          {" / "}
                          <span className="text-secondary">{rAvg}</span>
                        </td>
                        <td className="px-6 py-5 text-right font-label-ui text-xs uppercase text-foreground-muted">
                          {formatTimeAgo(record.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
