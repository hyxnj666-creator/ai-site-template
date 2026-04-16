"use client";

import { type LocalizedValue, platformPagesByLocale } from "@ai-site/content";
import { GlassPanel, accentTextClassNames } from "@ai-site/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalizedValue, useSiteLocale } from "../locale-provider";
import { AccentEyebrow } from "../ai-pages/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogLine = { text: string; level: "cmd" | "ok" | "info" | "error" | "dim" | "stream" };

type FlowNode = {
  id: string;
  label: string;
  type: "input" | "tool" | "output";
  status: "idle" | "active" | "done" | "error";
  ms?: number;
};

type Metrics = {
  latencyMs?: number;
  sources?: number;
  toolCalls?: number;
  chars?: number;
  tools?: number;
  actions?: number;
  artifacts?: number;
  protocol?: number;
};

type ToolEntry = {
  name: string;
  category: "protocol" | "action" | "artifact";
  description: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
};

type ExecState = "idle" | "running" | "done" | "error";

const COPY: LocalizedValue<{
  hero_eyebrow: string;
  hero_title: string;
  hero_desc: string;
  btn_list: string;
  btn_inspect: string;
  btn_demo: string;
  btn_running: string;
  registry_title: string;
  exec_title: string;
  exec_idle: string;
  log_title: string;
  metrics_title: string;
  metric_latency: string;
  metric_sources: string;
  metric_tools: string;
  metric_chars: string;
  summary_title: string;
  cat_protocol: string;
  cat_action: string;
  cat_artifact: string;
  schema_in: string;
  schema_out: string;
  status_ready: string;
  status_running: string;
  status_done: string;
}> = {
  zh: {
    hero_eyebrow: "模型上下文协议",
    hero_title: "MCP 协议调试台",
    hero_desc: "真实 MCP 执行桥接 — 可观测的工具调用链、策略检查与流式响应，一套接口统一调度所有 AI 能力。",
    btn_list: "列出工具",
    btn_inspect: "检查 Registry",
    btn_demo: "▶  执行 Demo",
    btn_running: "执行中...",
    registry_title: "工具注册表",
    exec_title: "执行流水线",
    exec_idle: "点击「执行 Demo」运行真实工具调用链",
    log_title: "协议日志",
    metrics_title: "执行指标",
    metric_latency: "端到端延迟",
    metric_sources: "知识来源",
    metric_tools: "工具调用",
    metric_chars: "生成字数",
    summary_title: "执行摘要",
    cat_protocol: "PROTOCOL",
    cat_action: "ACTION",
    cat_artifact: "ARTIFACT",
    schema_in: "Input",
    schema_out: "Output",
    status_ready: "就绪",
    status_running: "运行中",
    status_done: "完成",
  },
  en: {
    hero_eyebrow: "Model Context Protocol",
    hero_title: "MCP Debug Console",
    hero_desc: "Real MCP execution bridge — observable tool call chains, policy enforcement, and streaming responses. One interface to orchestrate all AI capabilities.",
    btn_list: "List Tools",
    btn_inspect: "Inspect Registry",
    btn_demo: "▶  Run Demo",
    btn_running: "Running...",
    registry_title: "Tool Registry",
    exec_title: "Execution Pipeline",
    exec_idle: "Click \"Run Demo\" to execute a real tool call chain",
    log_title: "Protocol Log",
    metrics_title: "Execution Metrics",
    metric_latency: "End-to-end Latency",
    metric_sources: "Knowledge Sources",
    metric_tools: "Tool Calls",
    metric_chars: "Chars Generated",
    summary_title: "Execution Summary",
    cat_protocol: "PROTOCOL",
    cat_action: "ACTION",
    cat_artifact: "ARTIFACT",
    schema_in: "Input",
    schema_out: "Output",
    status_ready: "Ready",
    status_running: "Running",
    status_done: "Done",
  },
};

// ─── Color helpers ────────────────────────────────────────────────────────────

const LOG_COLORS: Record<LogLine["level"], string> = {
  cmd: "text-primary font-semibold",
  ok: "text-emerald-400",
  info: "text-foreground-muted",
  error: "text-red-400",
  dim: "text-foreground-muted/50",
  stream: "text-secondary",
};

const CAT_COLORS: Record<ToolEntry["category"], string> = {
  protocol: "text-primary border-primary/20 bg-primary/8",
  action: "text-secondary border-secondary/20 bg-secondary/8",
  artifact: "text-tertiary border-tertiary/20 bg-tertiary/8",
};

const NODE_STYLES: Record<FlowNode["status"], string> = {
  idle: "border-white/10 bg-white/[0.03] text-foreground-muted/50",
  active: "border-primary/50 bg-primary/10 text-primary shadow-[0_0_20px_rgba(208,188,255,0.25)] animate-pulse",
  done: "border-emerald-500/40 bg-emerald-500/8 text-emerald-400",
  error: "border-red-500/40 bg-red-500/8 text-red-400",
};

const NODE_CONNECTOR_STYLES: Record<FlowNode["status"], string> = {
  idle: "bg-white/10",
  active: "bg-gradient-to-r from-primary/60 to-primary/20 animate-pulse",
  done: "bg-gradient-to-r from-emerald-500/60 to-emerald-500/20",
  error: "bg-red-500/30",
};

// ─── ExecutionPipeline ────────────────────────────────────────────────────────

function ExecutionPipeline({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {nodes.map((node, i) => (
        <div className="flex items-center" key={node.id}>
          <div className={[
            "relative flex min-w-[88px] flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-center transition-all duration-500",
            NODE_STYLES[node.status],
          ].join(" ")}>
            {/* Status dot */}
            <div className={[
              "h-1.5 w-1.5 rounded-full",
              node.status === "idle" ? "bg-white/20" :
              node.status === "active" ? "bg-primary animate-ping" :
              node.status === "done" ? "bg-emerald-400" : "bg-red-400",
            ].join(" ")} />
            <span className="font-label-ui text-[9px] font-medium leading-none tracking-[0.12em] uppercase">{node.label}</span>
            {node.ms != null && node.status === "done" && (
              <span className="font-label-ui text-[8px] text-foreground-muted/40 leading-none">{node.ms}ms</span>
            )}
          </div>
          {i < nodes.length - 1 && (
            <div className={["mx-1 h-px w-6 shrink-0 transition-all duration-700", NODE_CONNECTOR_STYLES[nodes[i + 1]?.status ?? "idle"]].join(" ")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── StreamingLog ─────────────────────────────────────────────────────────────

function StreamingLog({ lines }: { lines: LogLine[] }) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={logRef}
      className="scrollbar-thin h-52 overflow-y-auto rounded-[18px] bg-black/50 px-4 py-3 font-mono"
    >
      {lines.length === 0 ? (
        <span className="text-[11px] text-foreground-muted/30">$ _</span>
      ) : (
        lines.map((line, i) => (
          <div className={["text-[11px] leading-6", LOG_COLORS[line.level]].join(" ")} key={i}>
            {line.text}
          </div>
        ))
      )}
      <span className="inline-block h-3 w-1.5 animate-[blink_1s_step-end_infinite] bg-primary/60 align-middle" />
    </div>
  );
}

// ─── MetricsPanel ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  suffix = "",
  accent,
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  accent: "primary" | "secondary" | "tertiary" | "emerald";
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const target = value;
    const start = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  const colorMap = {
    primary: { text: "text-primary", bg: "bg-primary/5", border: "border-primary/15" },
    secondary: { text: "text-secondary", bg: "bg-secondary/5", border: "border-secondary/15" },
    tertiary: { text: "text-tertiary", bg: "bg-tertiary/5", border: "border-tertiary/15" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/15" },
  };
  const c = colorMap[accent];

  return (
    <div className={["rounded-2xl border px-4 py-4 transition-all duration-500", c.bg, c.border].join(" ")}>
      <p className={["font-label-ui text-[9px] uppercase tracking-[0.24em]", c.text].join(" ")}>{label}</p>
      <p className="font-display-ui mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
        {value != null ? `${display}${suffix}` : "—"}
      </p>
    </div>
  );
}

// ─── ToolRegistry ─────────────────────────────────────────────────────────────

function ToolRegistry({
  tools,
  copy,
  activeTool,
  onSelect,
}: {
  tools: ToolEntry[];
  copy: (typeof COPY)["en"];
  activeTool: string | null;
  onSelect: (name: string | null) => void;
}) {
  const groups = [
    { key: "protocol" as const, tools: tools.filter(t => t.category === "protocol") },
    { key: "action" as const, tools: tools.filter(t => t.category === "action") },
    { key: "artifact" as const, tools: tools.filter(t => t.category === "artifact") },
  ];

  return (
    <div className="space-y-2">
      {groups.map(group => (
        <div key={group.key}>
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <span className={["font-label-ui text-[9px] uppercase tracking-[0.28em]", CAT_COLORS[group.key].split(" ")[0]].join(" ")}>
              {copy[`cat_${group.key}` as "cat_protocol" | "cat_action" | "cat_artifact"]}
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="font-label-ui text-[9px] text-foreground-muted/30">{group.tools.length}</span>
          </div>
          {group.tools.map(tool => (
            <button
              className={[
                "w-full rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                activeTool === tool.name
                  ? "bg-white/[0.06] ring-1 ring-primary/20"
                  : "hover:bg-white/[0.03]",
              ].join(" ")}
              key={tool.name}
              onClick={() => onSelect(activeTool === tool.name ? null : tool.name)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={["font-mono text-[11px]", CAT_COLORS[group.key].split(" ")[0]].join(" ")}>{tool.name}</span>
                <span className={["rounded-full border px-1.5 py-0.5 font-label-ui text-[8px] uppercase tracking-[0.12em]", CAT_COLORS[group.key]].join(" ")}>
                  {group.key}
                </span>
              </div>
              {activeTool === tool.name && (
                <div className="mt-2 space-y-2 animate-fade-up">
                  <p className="text-[10px] leading-5 text-foreground-muted/70">{tool.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-1 font-label-ui text-[8px] uppercase tracking-[0.2em] text-foreground-muted/40">{copy.schema_in}</p>
                      {Object.entries(tool.inputSchema).map(([k, v]) => (
                        <p className="font-mono text-[9px] text-secondary/70" key={k}>
                          <span className="text-foreground-muted/60">{k}</span>: {v}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="mb-1 font-label-ui text-[8px] uppercase tracking-[0.2em] text-foreground-muted/40">{copy.schema_out}</p>
                      {Object.entries(tool.outputSchema).map(([k, v]) => (
                        <p className="font-mono text-[9px] text-emerald-400/70" key={k}>
                          <span className="text-foreground-muted/60">{k}</span>: {v}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const IDLE_FLOW_NODES: FlowNode[] = [
  { id: "input", label: "Input", type: "input", status: "idle" },
  { id: "policy", label: "Policy", type: "tool", status: "idle" },
  { id: "search", label: "searchKnowledge", type: "tool", status: "idle" },
  { id: "context", label: "loadContext", type: "tool", status: "idle" },
  { id: "stream", label: "streamText", type: "tool", status: "idle" },
  { id: "output", label: "Output", type: "output", status: "idle" },
];

export function McpInterfacePage() {
  const content = useLocalizedValue(platformPagesByLocale).mcp;
  const copy = useLocalizedValue(COPY);
  const { locale } = useSiteLocale();

  const [execState, setExecState] = useState<ExecState>("idle");
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(IDLE_FLOW_NODES);
  const [metrics, setMetrics] = useState<Metrics>({});
  const [summary, setSummary] = useState("");
  const [tools, setTools] = useState<ToolEntry[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Fetch tool registry on mount
  useEffect(() => {
    fetch("/api/mcp/run")
      .then(r => r.json())
      .then((d: { tools?: ToolEntry[] }) => { if (d.tools) setTools(d.tools); })
      .catch(() => {});
  }, []);

  // Animate log lines one by one with delay
  const streamLogs = useCallback((lines: LogLine[]) => {
    setLogLines([]);
    lines.forEach((line, i) => {
      setTimeout(() => setLogLines(prev => [...prev, line]), i * 80);
    });
  }, []);

  // Animate flow nodes one by one
  const animateFlowNodes = useCallback((nodes: FlowNode[] | null) => {
    if (!nodes) return;
    const resolvedNodes = IDLE_FLOW_NODES.map(idleNode => {
      const match = nodes.find(n => n.id === idleNode.id);
      return match ?? { ...idleNode, status: "done" as const };
    });
    setFlowNodes(IDLE_FLOW_NODES);
    resolvedNodes.forEach((node, i) => {
      setTimeout(() => {
        setFlowNodes(prev => prev.map((n, j) =>
          j === i ? { ...n, status: "active" } : n
        ));
      }, i * 280);
      setTimeout(() => {
        setFlowNodes(prev => prev.map((n, j) =>
          j === i ? { ...node, status: "done" } : n
        ));
      }, i * 280 + 400);
    });
  }, []);

  const runAction = useCallback(async (action: "list_tools" | "inspect_registry" | "run_demo") => {
    if (execState === "running") return;
    setExecState("running");
    setLogLines([{ text: `$ mcp.${action.replace("_", ".")} ...`, level: "cmd" }]);
    setSummary("");

    try {
      const res = await fetch("/api/mcp/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, locale }),
      });

      const data = await res.json() as {
        logs?: LogLine[];
        summary?: string;
        metrics?: Metrics;
        flowNodes?: FlowNode[] | null;
        tools?: ToolEntry[];
      };

      if (data.tools) setTools(data.tools);
      if (data.metrics) setMetrics(data.metrics);
      if (data.summary) setSummary(data.summary);
      if (data.logs) streamLogs(data.logs);
      if (action === "run_demo") animateFlowNodes(data.flowNodes ?? null);

      setExecState("done");
    } catch (err) {
      setLogLines([
        { text: `$ mcp.${action}`, level: "cmd" },
        { text: `[error]   ${err instanceof Error ? err.message : "unknown"}`, level: "error" },
      ]);
      setExecState("error");
    }
  }, [execState, locale, streamLogs, animateFlowNodes]);

  const registryMetrics: Metrics = tools.length > 0 ? {
    tools: tools.length,
    protocol: tools.filter(t => t.category === "protocol").length,
    actions: tools.filter(t => t.category === "action").length,
    artifacts: tools.filter(t => t.category === "artifact").length,
  } : {};

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-24 pt-10 md:px-8">
      {/* Background glows */}
      <div className="pointer-events-none absolute left-[5%] top-20 h-72 w-72 rounded-full bg-primary/8 blur-[100px]" />
      <div className="pointer-events-none absolute right-[10%] top-48 h-80 w-80 rounded-full bg-tertiary/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-secondary/6 blur-[100px]" />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="mx-auto mb-10 max-w-screen-2xl">
        <AccentEyebrow accent="tertiary">{copy.hero_eyebrow}</AccentEyebrow>
        <h1 className="font-display-ui mt-4 text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
          {copy.hero_title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-foreground-muted">
          {copy.hero_desc}
        </p>

        {/* Status bar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className={[
            "flex items-center gap-2 rounded-full border px-3 py-1.5 font-label-ui text-[10px] uppercase tracking-[0.2em] transition-all",
            execState === "idle" ? "border-white/10 text-foreground-muted/60" :
            execState === "running" ? "border-primary/30 bg-primary/5 text-primary" :
            execState === "done" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" :
            "border-red-500/30 bg-red-500/5 text-red-400",
          ].join(" ")}>
            <span className={[
              "h-1.5 w-1.5 rounded-full",
              execState === "idle" ? "bg-white/20" :
              execState === "running" ? "bg-primary animate-ping" :
              execState === "done" ? "bg-emerald-400" : "bg-red-400",
            ].join(" ")} />
            {execState === "idle" ? copy.status_ready :
             execState === "running" ? copy.status_running : copy.status_done}
          </div>
          {tools.length > 0 && (
            <span className="font-label-ui text-[10px] text-foreground-muted/40">
              {tools.length} capabilities indexed
            </span>
          )}
        </div>
      </header>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-screen-2xl gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">

        {/* ── LEFT: Registry Explorer ──────────────────────────────────── */}
        <aside className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <GlassPanel className="rounded-[24px] border border-white/[0.06] p-5">
            <div className="mb-4 flex items-center justify-between">
              <AccentEyebrow accent="primary">{copy.registry_title}</AccentEyebrow>
              {tools.length > 0 && (
                <span className="font-label-ui text-[9px] text-foreground-muted/30">
                  {tools.length} tools
                </span>
              )}
            </div>

            {/* Registry metrics row */}
            {registryMetrics.tools != null && (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Proto", value: registryMetrics.protocol, accent: "primary" },
                  { label: "Action", value: registryMetrics.actions, accent: "secondary" },
                  { label: "Artifact", value: registryMetrics.artifacts, accent: "tertiary" },
                ].map(m => (
                  <div className="rounded-xl bg-white/[0.03] px-2 py-2 text-center" key={m.label}>
                    <p className={["font-display-ui text-lg font-semibold", accentTextClassNames[m.accent as "primary"]].join(" ")}>{m.value}</p>
                    <p className="font-label-ui text-[8px] uppercase tracking-[0.15em] text-foreground-muted/40">{m.label}</p>
                  </div>
                ))}
              </div>
            )}

            {tools.length > 0 ? (
              <ToolRegistry
                activeTool={activeTool}
                copy={copy}
                onSelect={setActiveTool}
                tools={tools}
              />
            ) : (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div className="h-8 animate-pulse rounded-xl bg-white/[0.04]" key={i} />
                ))}
              </div>
            )}
          </GlassPanel>
        </aside>

        {/* ── RIGHT: Execution Console ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* Control bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-white/[0.06] bg-surface-low/60 px-5 py-4 backdrop-blur">
            <span className="font-label-ui mr-2 text-[9px] uppercase tracking-[0.2em] text-foreground-muted/40">actions</span>
            <button
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-label-ui text-[10px] uppercase tracking-[0.15em] text-foreground-muted transition-all hover:bg-white/[0.07] hover:text-foreground"
              disabled={execState === "running"}
              onClick={() => void runAction("list_tools")}
              type="button"
            >
              {copy.btn_list}
            </button>
            <button
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-label-ui text-[10px] uppercase tracking-[0.15em] text-foreground-muted transition-all hover:bg-white/[0.07] hover:text-foreground"
              disabled={execState === "running"}
              onClick={() => void runAction("inspect_registry")}
              type="button"
            >
              {copy.btn_inspect}
            </button>
            <button
              className={[
                "ml-auto rounded-full border px-5 py-2 font-label-ui text-[10px] uppercase tracking-[0.15em] transition-all",
                execState === "running"
                  ? "cursor-not-allowed border-primary/20 bg-primary/5 text-primary/50"
                  : "border-primary/30 bg-primary/10 text-primary hover:border-primary/50 hover:bg-primary/15 hover:shadow-[0_0_20px_rgba(208,188,255,0.15)]",
              ].join(" ")}
              disabled={execState === "running"}
              onClick={() => void runAction("run_demo")}
              type="button"
            >
              {execState === "running" ? copy.btn_running : copy.btn_demo}
            </button>
          </div>

          {/* Execution pipeline */}
          <div className="rounded-[24px] border border-white/[0.06] bg-surface-low/40 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <AccentEyebrow accent="secondary">{copy.exec_title}</AccentEyebrow>
              {execState === "running" && (
                <span className="font-label-ui text-[9px] text-primary/60 animate-pulse">● live</span>
              )}
            </div>
            {execState === "idle" ? (
              <div className="flex h-24 items-center justify-center rounded-xl bg-black/20">
                <p className="font-label-ui text-[10px] uppercase tracking-[0.2em] text-foreground-muted/30">
                  {copy.exec_idle}
                </p>
              </div>
            ) : (
              <ExecutionPipeline nodes={flowNodes} />
            )}
          </div>

          {/* Protocol log + metrics row */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,1fr)]">

            {/* Log panel */}
            <div className="rounded-[24px] border border-white/[0.06] bg-black/30 p-5 backdrop-blur">
              <AccentEyebrow accent="tertiary" className="mb-3">{copy.log_title}</AccentEyebrow>
              <StreamingLog lines={logLines} />
            </div>

            {/* Metrics + summary */}
            <div className="space-y-4">
              {/* Metrics cards */}
              <div className="rounded-[24px] border border-white/[0.06] bg-surface-low/40 p-5 backdrop-blur">
                <AccentEyebrow accent="primary" className="mb-4">{copy.metrics_title}</AccentEyebrow>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    accent="primary"
                    label={copy.metric_latency}
                    suffix="ms"
                    value={metrics.latencyMs}
                  />
                  <MetricCard
                    accent="secondary"
                    label={copy.metric_sources}
                    value={metrics.sources}
                  />
                  <MetricCard
                    accent="tertiary"
                    label={copy.metric_tools}
                    value={metrics.toolCalls}
                  />
                  <MetricCard
                    accent="emerald"
                    label={copy.metric_chars}
                    value={metrics.chars}
                  />
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div className="animate-fade-up rounded-[20px] border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <p className="mb-2 font-label-ui text-[9px] uppercase tracking-[0.22em] text-emerald-400/60">
                    {copy.summary_title}
                  </p>
                  <p className="text-[11px] leading-6 text-foreground-muted">{summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Safeguards */}
          <div className="rounded-[24px] border border-white/[0.06] bg-surface-low/30 p-5 backdrop-blur">
            <AccentEyebrow accent="tertiary" className="mb-4">
              {locale === "zh" ? "约束层" : "Safeguards"}
            </AccentEyebrow>
            <div className="grid gap-4 md:grid-cols-3">
              {content.safeguards.map((s) => (
                <div
                  className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:border-white/[0.08]"
                  key={s.title}
                >
                  <p className={["mb-2 inline-block rounded-full border px-2 py-0.5 font-label-ui text-[9px] uppercase tracking-[0.18em]", s.accent === "primary" ? "text-primary border-primary/20 bg-primary/5" : s.accent === "secondary" ? "text-secondary border-secondary/20 bg-secondary/5" : "text-tertiary border-tertiary/20 bg-tertiary/5"].join(" ")}>
                    {locale === "zh" ? "安全边界" : "Guardrail"}
                  </p>
                  <h3 className="font-display-ui text-lg font-semibold tracking-[-0.03em]">{s.title}</h3>
                  <p className="mt-2 text-[11px] leading-6 text-foreground-muted">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
