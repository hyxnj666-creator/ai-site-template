"use client";

import type { AgentOsSystemSnapshot, AgentPolicy, AgentSessionSummary } from "@ai-site/ai";
import { accentTextClassNames } from "@ai-site/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalizedValue, useSiteLocale } from "../../locale-provider";
import { AccentEyebrow, accentBorderClassNames } from "../shared";
import type { LocalizedValue } from "@ai-site/content";

// ─── Copy ─────────────────────────────────────────────────────────────────────

interface OsConsoleCopy {
  activeSessionsLabel: string;
  avgLatencyLabel: string;
  consoleBoot: string[];
  description: string;
  eyebrow: string;
  justNowLabel: string;
  knowledgeLabel: string;
  knowledgeOff: string;
  knowledgeOn: string;
  lastSyncLabel: string;
  noSessionsHint: string;
  sessionLimitLabel: string;
  policiesLabel: string;
  policiesCount: string;
  ragLabel: string;
  ragOff: string;
  ragOn: string;
  refreshLabel: string;
  refreshingLabel: string;
  runsTodayLabel: string;
  sessionIdLabel: string;
  sessionRunsLabel: string;
  sessionStatusLabel: string;
  sessionSurfaceLabel: string;
  sessionsLabel: string;
  systemLabel: string;
  title: string;
  tokensTodayLabel: string;
  toolCallsLabel: string;
}

const copyByLocale: LocalizedValue<OsConsoleCopy> = {
  en: {
    activeSessionsLabel: "Active Sessions",
    avgLatencyLabel: "Avg Latency",
    consoleBoot: [
      "agent-os v1.0 booting...",
      "loading session registry... ok",
      "connecting to pgvector knowledge store...",
      "mounting policy engine... ok",
      "agent surfaces online: chat / agent / arena / mcp / workflow",
      "system ready ✓",
    ],
    description:
      "Real-time console for the AI OS runtime. Monitor active sessions, run traces, tool call chains, knowledge retrieval, and policy enforcement across all agent surfaces.",
    eyebrow: "AGENT OS",
    justNowLabel: "just now",
    knowledgeLabel: "Knowledge Index",
    knowledgeOff: "not indexed",
    knowledgeOn: "vector ready",
    lastSyncLabel: "last sync",
    noSessionsHint: "No active sessions. Interact with any AI surface to start tracking.",
    sessionLimitLabel: "showing up to 10",
    policiesLabel: "Active Policies",
    policiesCount: "policies enforced",
    ragLabel: "RAG Engine",
    ragOff: "tfidf fallback",
    ragOn: "pgvector active",
    refreshLabel: "Refresh",
    refreshingLabel: "Refreshing...",
    runsTodayLabel: "Runs Today",
    sessionIdLabel: "Session",
    sessionRunsLabel: "Runs",
    sessionStatusLabel: "Status",
    sessionSurfaceLabel: "Surface",
    sessionsLabel: "Recent Sessions",
    systemLabel: "System",
    title: "Agent OS Console",
    tokensTodayLabel: "Tokens Today",
    toolCallsLabel: "Tool Calls",
  },
  zh: {
    activeSessionsLabel: "活跃会话",
    avgLatencyLabel: "平均延迟",
    consoleBoot: [
      "agent-os v1.0 启动中...",
      "加载会话注册表... 完成",
      "连接 pgvector 知识库...",
      "挂载策略引擎... 完成",
      "Agent 接入面: chat / agent / arena / mcp / workflow",
      "系统就绪 ✓",
    ],
    description:
      "AI OS 运行时实时控制台。监控活跃会话、运行追踪、工具调用链路、知识检索与策略执行，覆盖全部 Agent 接入面。",
    eyebrow: "AGENT OS",
    justNowLabel: "刚刚",
    knowledgeLabel: "知识索引",
    knowledgeOff: "未建立向量索引",
    knowledgeOn: "向量检索就绪",
    lastSyncLabel: "上次同步",
    noSessionsHint: "暂无活跃会话。与任意 AI 接入面交互即可开始追踪。",
    sessionLimitLabel: "最多显示 10 条",
    policiesLabel: "策略引擎",
    policiesCount: "条策略执行中",
    ragLabel: "RAG 引擎",
    ragOff: "TF-IDF 降级",
    ragOn: "pgvector 激活",
    refreshLabel: "刷新",
    refreshingLabel: "刷新中...",
    runsTodayLabel: "今日运行",
    sessionIdLabel: "会话",
    sessionRunsLabel: "运行数",
    sessionStatusLabel: "状态",
    sessionSurfaceLabel: "接入面",
    sessionsLabel: "近期会话",
    systemLabel: "系统",
    title: "Agent OS 控制台",
    tokensTodayLabel: "今日 Token",
    toolCallsLabel: "工具调用",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms: number) {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtNum(n: number) {
  if (n === 0) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function relativeTime(iso: string, justNowLabel: string) {
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return justNowLabel;
  if (delta < 3600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86400_000) return `${Math.floor(delta / 3600_000)}h ago`;
  return `${Math.floor(delta / 86400_000)}d ago`;
}

const STATUS_COLOR: Record<string, string> = {
  completed: "text-emerald-400",
  failed: "text-red-400",
  idle: "text-zinc-500",
  running: "text-cyan-400",
  streaming: "text-indigo-400",
};

const SURFACE_ICON: Record<string, string> = {
  agent: "◈",
  arena: "⬡",
  chat: "◇",
  knowledge: "◎",
  mcp: "⬢",
  system: "⊕",
  workflow: "◫",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent: "primary" | "secondary" | "tertiary";
  sub?: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${accentBorderClassNames[accent]} bg-white/[0.03] flex flex-col gap-1`}>
      <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-bold font-mono tabular-nums ${accentTextClassNames[accent]}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-600 font-mono">{sub}</span>}
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-cyan-400" : "bg-zinc-600"}`} />
    </span>
  );
}

function PolicyRow({ policy }: { policy: AgentPolicy }) {
  const actionColor = {
    allow: "text-emerald-400",
    deny: "text-red-400",
    rate_limit: "text-amber-400",
    reroute: "text-indigo-400",
  }[policy.action] ?? "text-zinc-400";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0">
      <StatusDot active={policy.enabled} />
      <span className="flex-1 text-sm text-zinc-300 font-mono truncate">{policy.name}</span>
      <span className={`text-xs font-mono ${actionColor}`}>{policy.action}</span>
      {policy.rateLimit && (
        <span className="text-xs text-zinc-600 font-mono">{policy.rateLimit}/min</span>
      )}
    </div>
  );
}

function SessionRow({ session, copy }: { session: AgentSessionSummary; copy: OsConsoleCopy }) {
  const icon = SURFACE_ICON[session.surface] ?? "◇";
  const statusColor = STATUS_COLOR[session.status] ?? "text-zinc-400";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.05] last:border-0 group hover:bg-white/[0.02] transition-colors px-1 rounded">
      <span className="text-lg text-cyan-500/70 font-mono mt-0.5 w-5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono truncate">{session.id.slice(0, 12)}…</span>
          <span className={`text-xs font-mono ${statusColor}`}>{session.status}</span>
        </div>
        {session.lastPromptSnippet && (
          <p className="text-xs text-zinc-400 font-mono mt-0.5 line-clamp-1 truncate">
            {session.lastPromptSnippet}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-zinc-600 font-mono">{session.surface}</span>
          <span className="text-xs text-zinc-600 font-mono">{copy.sessionRunsLabel}: {session.runCount}</span>
          <span className="text-xs text-zinc-600 font-mono">{relativeTime(session.lastActiveAt, copy.justNowLabel)}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-600 font-mono shrink-0">
        {session.locale.toUpperCase()}
      </span>
    </div>
  );
}

function BootSequence({ lines }: { lines: string[] }) {
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const tick = setInterval(() => {
      if (i >= lines.length) {
        clearInterval(tick);
        return;
      }
      setVisible((v) => [...v, lines[i]!]);
      i++;
    }, 220);
    return () => clearInterval(tick);
  }, [lines]);

  return (
    <div className="font-mono text-xs text-cyan-400/80 space-y-0.5">
      {visible.map((line, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-zinc-600">$</span>
          <span>{line}</span>
        </div>
      ))}
      {visible.length < lines.length && (
        <div className="flex gap-2">
          <span className="text-zinc-600">$</span>
          <span className="animate-pulse text-zinc-500">_</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentOsConsole() {
  const locale = useSiteLocale();
  const copy = useLocalizedValue(copyByLocale);

  const [snapshot, setSnapshot] = useState<AgentOsSystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSnapshot = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await fetch(`/api/agent/sessions?locale=${locale}`);
        if (res.ok) {
          const data = (await res.json()) as { snapshot: AgentOsSystemSnapshot };
          setSnapshot(data.snapshot);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    // Delay initial fetch so boot sequence plays first
    const t = setTimeout(() => {
      setBootDone(true);
      void fetchSnapshot();
    }, copy.consoleBoot.length * 220 + 400);

    return () => clearTimeout(t);
  }, [copy.consoleBoot.length, fetchSnapshot]);

  useEffect(() => {
    if (!bootDone) return;
    intervalRef.current = setInterval(() => void fetchSnapshot(true), 15_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bootDone, fetchSnapshot]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.07] bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-mono text-sm font-bold tracking-widest">
              ⊕ AGENT_OS
            </span>
            <span className="text-zinc-700 font-mono text-xs">v1.0</span>
            {snapshot && (
              <span className="ml-2 flex items-center gap-1.5">
                <StatusDot active={snapshot.activeSessions > 0} />
                <span className="text-xs text-zinc-500 font-mono">
                  {snapshot.activeSessions} {copy.activeSessionsLabel.toLowerCase()}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {snapshot && (
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${snapshot.ragEnabled ? "text-cyan-400 bg-cyan-900/30" : "text-zinc-500 bg-zinc-900"}`}>
                {snapshot.ragEnabled ? copy.ragOn : copy.ragOff}
              </span>
            )}
            <button
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              disabled={refreshing}
              onClick={() => void fetchSnapshot()}
            >
              {refreshing ? copy.refreshingLabel : copy.refreshLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <AccentEyebrow accent="secondary">{copy.eyebrow}</AccentEyebrow>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            {copy.title}
          </h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed">{copy.description}</p>
        </div>

        {/* ── Boot sequence ─────────────────────────────────────────────────── */}
        {!bootDone && (
          <div className="rounded-xl border border-white/[0.07] bg-zinc-950 p-6">
            <BootSequence lines={copy.consoleBoot} />
          </div>
        )}

        {bootDone && (
          <>
            {/* ── Metrics row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricTile
                accent="secondary"
                label={copy.activeSessionsLabel}
                value={loading ? "—" : fmtNum(snapshot?.activeSessions ?? 0)}
              />
              <MetricTile
                accent="primary"
                label={copy.runsTodayLabel}
                value={loading ? "—" : fmtNum(snapshot?.runsToday ?? 0)}
              />
              <MetricTile
                accent="tertiary"
                label={copy.toolCallsLabel}
                value={loading ? "—" : fmtNum(snapshot?.toolCallsToday ?? 0)}
              />
              <MetricTile
                accent="secondary"
                label={copy.avgLatencyLabel}
                value={loading ? "—" : fmtMs(snapshot?.avgLatencyMs ?? 0)}
                sub={snapshot ? `${fmtNum(snapshot.tokensToday)} ${copy.tokensTodayLabel}` : undefined}
              />
            </div>

            {/* ── Main grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sessions panel — 2/3 width */}
              <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-zinc-950/60 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <span className="text-sm font-semibold text-zinc-200 font-mono tracking-wide">
                    {copy.sessionsLabel}
                  </span>
                  <span className="text-xs text-zinc-600 font-mono">
                    {snapshot?.recentSessions.length ?? 0} — {copy.sessionLimitLabel}
                  </span>
                </div>
                <div className="px-5">
                  {!snapshot || snapshot.recentSessions.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-sm text-zinc-600 font-mono">{copy.noSessionsHint}</p>
                    </div>
                  ) : (
                    snapshot.recentSessions.map((session) => (
                      <SessionRow key={session.id} copy={copy} session={session} />
                    ))
                  )}
                </div>
              </div>

              {/* Right column: policies + status */}
              <div className="space-y-6">
                {/* Policy panel */}
                <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <span className="text-sm font-semibold text-zinc-200 font-mono tracking-wide">
                      {copy.policiesLabel}
                    </span>
                    <span className={`text-xs font-mono ${accentTextClassNames.tertiary}`}>
                      {snapshot?.policies.length ?? DEFAULT_POLICIES_COUNT} {copy.policiesCount}
                    </span>
                  </div>
                  <div className="px-5">
                    {(snapshot?.policies ?? FALLBACK_POLICIES).map((policy) => (
                      <PolicyRow key={policy.id} policy={policy} />
                    ))}
                  </div>
                </div>

                {/* System status */}
                <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06]">
                    <span className="text-sm font-semibold text-zinc-200 font-mono tracking-wide">
                      {copy.systemLabel}
                    </span>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-500">{copy.ragLabel}</span>
                      <span className={`text-xs font-mono ${snapshot?.ragEnabled ? "text-cyan-400" : "text-zinc-600"}`}>
                        {snapshot?.ragEnabled ? copy.ragOn : copy.ragOff}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-500">{copy.knowledgeLabel}</span>
                      <span className={`text-xs font-mono ${snapshot?.knowledgeReady ? "text-emerald-400" : "text-zinc-600"}`}>
                        {snapshot?.knowledgeReady ? copy.knowledgeOn : copy.knowledgeOff}
                      </span>
                    </div>
                    {snapshot?.snapshotAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-zinc-600">{copy.lastSyncLabel}</span>
                        <span className="text-xs font-mono text-zinc-600">
                          {relativeTime(snapshot.snapshotAt, copy.justNowLabel)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Fallback policies for when API hasn't loaded yet
const DEFAULT_POLICIES_COUNT = 3;
const FALLBACK_POLICIES: AgentPolicy[] = [
  {
    action: "rate_limit",
    createdAt: new Date().toISOString(),
    description: "Limit agent surface to 8 req/min",
    enabled: true,
    id: "policy-agent-rate",
    name: "Agent Rate Guard",
    rateLimit: 8,
    trigger: "rate",
  },
  {
    action: "rate_limit",
    createdAt: new Date().toISOString(),
    description: "Limit chat surface to 20 req/min",
    enabled: true,
    id: "policy-chat-rate",
    name: "Chat Rate Guard",
    rateLimit: 20,
    trigger: "rate",
  },
  {
    action: "rate_limit",
    createdAt: new Date().toISOString(),
    description: "Limit intent classification to 30 req/min",
    enabled: true,
    id: "policy-intent-rate",
    name: "Intent Rate Guard",
    rateLimit: 30,
    trigger: "rate",
  },
];
