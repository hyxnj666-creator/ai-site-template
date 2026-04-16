"use client";

import {
  getDefaultGraph,
  getNodeCatalog,
  getWorkflowTemplates,
  type WorkflowGraph,
  type WorkflowNodeType,
  type WorkflowTemplate,
  type NodeExecutionStatus,
  type WorkflowNodeCatalogItem,
} from "@ai-site/ai";
import { GlassPanel, SignalPill } from "@ai-site/ui";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useSiteLocale } from "../locale-provider";
import { StudioNode, type StudioNodeData } from "../workflow/studio-nodes";
import { AnimatedEdge } from "../workflow/studio-edges";

interface NodeExecState {
  status: NodeExecutionStatus;
  output?: string;
  latencyMs?: number;
}

interface CopyStrings {
  run: string;
  running: string;
  stop: string;
  executionLog: string;
  nodesRunning: string;
  completed: string;
  totalLatency: string;
  prompt: string;
  promptPlaceholder: string;
  nodeConfig: string;
  selectedNode: string;
  noSelection: string;
  noSelectionHint: string;
  nodeType: string;
  nodeLabel: string;
  model: string;
  temperature: string;
  toolName: string;
  palette: string;
  dragHint: string;
  workflowDone: string;
  workflowError: string;
  emptyLog: string;
  execOutput: string;
  execLatency: string;
  execStatus: string;
  deleteNode: string;
  outputSummary: string;
  outputTitle: string;
  outputEmpty: string;
  tabConfig: string;
  tabOutput: string;
  copy: string;
  copied: string;
  expand: string;
  collapse: string;
  finalOutput: string;
}

function getCopy(locale: string): CopyStrings {
  if (locale === "zh") {
    return {
      run: "运行",
      running: "执行中...",
      stop: "停止",
      executionLog: "执行日志",
      nodesRunning: "节点运行中",
      completed: "已完成",
      totalLatency: "总延迟",
      prompt: "输入提示",
      promptPlaceholder: "描述你希望这个工作流处理的任务...",
      nodeConfig: "节点配置",
      selectedNode: "选中节点",
      noSelection: "未选中节点",
      noSelectionHint: "点击画布中的节点查看和编辑配置",
      nodeType: "类型",
      nodeLabel: "名称",
      model: "模型",
      temperature: "Temperature",
      toolName: "工具名称",
      palette: "节点面板",
      dragHint: "拖拽到画布",
      workflowDone: "工作流执行完成",
      workflowError: "工作流执行失败",
      emptyLog: "点击「运行」启动工作流",
      execOutput: "执行输出",
      execLatency: "耗时",
      execStatus: "状态",
      deleteNode: "删除节点",
      outputSummary: "执行结果总览",
      outputTitle: "各节点输出",
      outputEmpty: "运行工作流后可查看各节点的执行结果",
      tabConfig: "配置",
      tabOutput: "结果",
      copy: "复制",
      copied: "已复制",
      expand: "展开",
      collapse: "收起",
      finalOutput: "最终输出",
    };
  }
  return {
    run: "Run",
    running: "Running...",
    stop: "Stop",
    executionLog: "Execution Log",
    nodesRunning: "nodes running",
    completed: "Completed",
    totalLatency: "Total Latency",
    prompt: "Prompt",
    promptPlaceholder: "Describe the task for this workflow...",
    nodeConfig: "Node Config",
    selectedNode: "Selected Node",
    noSelection: "No node selected",
    noSelectionHint: "Click a node on the canvas to edit its config",
    nodeType: "Type",
    nodeLabel: "Label",
    model: "Model",
    temperature: "Temperature",
    toolName: "Tool Name",
    palette: "Node Palette",
    dragHint: "Drag to canvas",
    workflowDone: "Workflow completed",
    workflowError: "Workflow execution failed",
    emptyLog: "Click Run to start the workflow",
    execOutput: "Execution Output",
    execLatency: "Latency",
    execStatus: "Status",
    deleteNode: "Delete Node",
    outputSummary: "Execution Summary",
    outputTitle: "Node Outputs",
    outputEmpty: "Run the workflow to see execution results",
    tabConfig: "Config",
    tabOutput: "Output",
    copy: "Copy",
    copied: "Copied",
    expand: "Expand",
    collapse: "Collapse",
    finalOutput: "Final Output",
  };
}

function graphToFlowNodes(
  graph: WorkflowGraph,
  locale: string,
  execStates: Map<string, NodeExecState>,
): Node[] {
  return graph.nodes.map((n) => {
    const execState = execStates.get(n.id);
    return {
      id: n.id,
      type: "studioNode",
      position: n.position,
      data: {
        label: n.label,
        nodeType: n.type,
        locale,
        config: n.config,
        executionStatus: execState?.status,
        executionOutput: execState?.output,
      } satisfies StudioNodeData,
    };
  });
}

function graphToFlowEdges(
  graph: WorkflowGraph,
  animatedEdges: Set<string>,
): Edge[] {
  return graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: "animatedEdge",
    label: e.label,
    data: { animated: animatedEdges.has(e.id) },
  }));
}

const nodeTypes = { studioNode: StudioNode };
const edgeTypes = { animatedEdge: AnimatedEdge };

interface LogEntry {
  timestamp: string;
  nodeId?: string;
  message: string;
  type: "info" | "success" | "error" | "system";
}

export function SentientFlowPage() {
  const { locale } = useSiteLocale();
  const copy = getCopy(locale);
  const catalog = useMemo(() => getNodeCatalog(locale === "zh" ? "zh" : "en"), [locale]);
  const defaultGraph = useMemo(() => getDefaultGraph(locale === "zh" ? "zh" : "en"), [locale]);

  const templates = useMemo(() => getWorkflowTemplates(locale === "zh" ? "zh" : "en"), [locale]);
  const [view, setView] = useState<"gallery" | "canvas">("gallery");

  const [graph, setGraph] = useState<WorkflowGraph>(defaultGraph);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    graphToFlowNodes(defaultGraph, locale, new Map()),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    graphToFlowEdges(defaultGraph, new Set()),
  );

  const [isRunning, setIsRunning] = useState(false);
  const [execStates, setExecStates] = useState<Map<string, NodeExecState>>(new Map());
  const [animatedEdges, setAnimatedEdges] = useState<Set<string>>(new Set());
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [totalLatencyMs, setTotalLatencyMs] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [logExpanded, setLogExpanded] = useState(false);
  const [rightTab, setRightTab] = useState<"config" | "result" | "detail">("config");
  const abortRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const nodeIdCounter = useRef(10);

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId),
    [graph, selectedNodeId],
  );

  const loadTemplate = useCallback(
    (template: WorkflowGraph) => {
      setGraph(template);
      setNodes(graphToFlowNodes(template, locale, new Map()));
      setEdges(graphToFlowEdges(template, new Set()));
      setExecStates(new Map());
      setAnimatedEdges(new Set());
      setLogEntries([]);
      setTotalLatencyMs(null);
      setSelectedNodeId(null);
      setPromptValue("");
      setRightTab("config");
      setView("canvas");
    },
    [locale, setNodes, setEdges],
  );

  const syncFlowFromExec = useCallback(
    (newExecStates: Map<string, NodeExecState>, newAnimated: Set<string>) => {
      setNodes(graphToFlowNodes(graph, locale, newExecStates));
      setEdges(graphToFlowEdges(graph, newAnimated));
    },
    [graph, locale, setNodes, setEdges],
  );

  const updateNodeInGraph = useCallback(
    (nodeId: string, updates: { label?: string; config?: Record<string, unknown> }) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          return {
            ...n,
            label: updates.label ?? n.label,
            config: updates.config !== undefined ? { ...n.config, ...updates.config } : n.config,
          };
        }),
      }));
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== nodeId) return n;
          const d = n.data as StudioNodeData;
          return {
            ...n,
            data: {
              ...d,
              label: updates.label ?? d.label,
              config: updates.config !== undefined ? { ...d.config, ...updates.config } : d.config,
            },
          };
        }),
      );
    },
    [setNodes],
  );

  const deleteNodeFromGraph = useCallback(
    (nodeId: string) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      }));
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges],
  );

  const addLog = useCallback((entry: LogEntry) => {
    setLogEntries((prev) => [...prev, entry]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const edgeId = `e-${params.source}-${params.target}-${Date.now()}`;
      setEdges((eds) => addEdge({ ...params, id: edgeId, type: "animatedEdge", data: { animated: false } }, eds));
      setGraph((prev) => ({
        ...prev,
        edges: [
          ...prev.edges,
          {
            id: edgeId,
            source: params.source!,
            target: params.target!,
            sourceHandle: params.sourceHandle ?? undefined,
            targetHandle: params.targetHandle ?? undefined,
          },
        ],
      }));
    },
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/workflow-node-type") as WorkflowNodeType;
      if (!nodeType) return;

      const catalogItem = catalog.find((c) => c.type === nodeType);
      if (!catalogItem) return;

      const reactFlowBounds = (event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 90,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      nodeIdCounter.current += 1;
      const newId = `${nodeType}-${nodeIdCounter.current}`;
      const newNode = {
        id: newId,
        type: nodeType,
        label: catalogItem.label,
        config: catalogItem.defaultConfig,
        position,
      };

      setGraph((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
      setNodes((prev) => [
        ...prev,
        {
          id: newId,
          type: "studioNode",
          position,
          data: {
            label: catalogItem.label,
            nodeType,
            locale,
            config: catalogItem.defaultConfig,
          } satisfies StudioNodeData,
        },
      ]);
    },
    [catalog, locale, setNodes],
  );

  const handleRun = useCallback(async () => {
    if (isRunning) {
      abortRef.current?.abort();
      return;
    }

    const prompt = promptValue.trim() || (locale === "zh"
      ? "帮我总结这个项目的 AI 架构和核心能力"
      : "Summarize the AI architecture and core capabilities of this project");

    setIsRunning(true);
    setLogEntries([]);
    setTotalLatencyMs(null);
    setLogExpanded(true);

    const freshExecStates = new Map<string, NodeExecState>();
    const freshAnimated = new Set<string>();
    setExecStates(freshExecStates);
    setAnimatedEdges(freshAnimated);
    syncFlowFromExec(freshExecStates, freshAnimated);

    const controller = new AbortController();
    abortRef.current = controller;

    const now = () => new Date().toLocaleTimeString("en-US", { hour12: false });

    addLog({ timestamp: now(), message: locale === "zh" ? "工作流启动..." : "Workflow starting...", type: "system" });

    try {
      const response = await fetch("/api/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, locale, prompt }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
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
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === "node_status") {
            const nodeId = String(event.nodeId);
            const status = String(event.status) as NodeExecutionStatus;
            const output = event.output ? String(event.output) : undefined;
            const latencyMs = typeof event.latencyMs === "number" ? event.latencyMs : undefined;

            freshExecStates.set(nodeId, { status, output, latencyMs });
            setExecStates(new Map(freshExecStates));

            if (status === "running") {
              const incomingEdges = graph.edges.filter((e) => e.target === nodeId);
              for (const e of incomingEdges) freshAnimated.add(e.id);
              setAnimatedEdges(new Set(freshAnimated));
            }
            if (status === "completed" || status === "failed") {
              const incomingEdges = graph.edges.filter((e) => e.target === nodeId);
              for (const e of incomingEdges) freshAnimated.delete(e.id);
              setAnimatedEdges(new Set(freshAnimated));
            }

            syncFlowFromExec(freshExecStates, freshAnimated);

            const nodeLabel = graph.nodes.find((n) => n.id === nodeId)?.label ?? nodeId;
            if (status === "completed") {
              addLog({
                timestamp: now(),
                nodeId,
                message: `${nodeLabel} → ${output?.slice(0, 100) ?? "done"}`,
                type: "success",
              });
            } else if (status === "failed") {
              addLog({ timestamp: now(), nodeId, message: `${nodeLabel} ✗ ${output ?? "failed"}`, type: "error" });
            } else if (status === "running") {
              addLog({ timestamp: now(), nodeId, message: `${nodeLabel} → ${locale === "zh" ? "执行中" : "executing"}...`, type: "info" });
            }
          } else if (event.type === "workflow_done") {
            setTotalLatencyMs(typeof event.totalLatencyMs === "number" ? event.totalLatencyMs : null);
            setRightTab("result");
            addLog({
              timestamp: now(),
              message: `${copy.workflowDone} (${typeof event.totalLatencyMs === "number" ? `${event.totalLatencyMs}ms` : ""})`,
              type: "system",
            });
          } else if (event.type === "workflow_error") {
            addLog({ timestamp: now(), message: `${copy.workflowError}: ${String(event.error)}`, type: "error" });
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        addLog({ timestamp: now(), message: `Error: ${(err as Error).message}`, type: "error" });
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [isRunning, promptValue, locale, graph, syncFlowFromExec, addLog, copy]);

  const runningCount = Array.from(execStates.values()).filter((s) => s.status === "running").length;
  const completedCount = Array.from(execStates.values()).filter((s) => s.status === "completed").length;

  const finalOutputText = useMemo(() => {
    const outputNode = graph.nodes.find((n) => n.type === "output");
    if (!outputNode) return null;
    const exec = execStates.get(outputNode.id);
    return exec?.output ?? null;
  }, [graph.nodes, execStates]);

  const llmOutputText = useMemo(() => {
    const llmNode = graph.nodes.find((n) => n.type === "llm");
    if (!llmNode) return null;
    const exec = execStates.get(llmNode.id);
    return exec?.output ?? null;
  }, [graph.nodes, execStates]);

  const mainResult = finalOutputText || llmOutputText;

  if (view === "gallery") {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background pt-16">
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="font-display-ui text-2xl font-bold tracking-tighter text-primary">
                Sentient Flow
              </h1>
              <p className="mt-2 text-sm text-foreground-muted">
                {locale === "zh" ? "选择一个工作流模板开始，或创建空白画布" : "Pick a workflow template to start, or create a blank canvas"}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Blank canvas card */}
            <button
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-surface-lowest/50 p-8 transition-all hover:border-primary/30 hover:bg-primary/5"
              onClick={() => { loadTemplate(defaultGraph); }}
              type="button"
            >
              <span className="text-3xl opacity-40 transition-opacity group-hover:opacity-70">+</span>
              <span className="text-sm text-foreground-muted group-hover:text-foreground">
                {locale === "zh" ? "空白画布" : "Blank Canvas"}
              </span>
            </button>
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-surface-lowest/60 p-6 text-left transition-all hover:border-primary/20 hover:bg-primary/5 hover:shadow-[0_0_30px_rgba(208,188,255,0.08)]"
                onClick={() => loadTemplate(tpl.graph)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tpl.icon}</span>
                  <h3 className="font-display-ui text-sm font-bold text-foreground">{tpl.name}</h3>
                </div>
                <p className="text-xs leading-5 text-foreground-muted">{tpl.description}</p>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-foreground-muted">
                    {tpl.nodeCount} {locale === "zh" ? "节点" : "nodes"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background pt-16">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-background/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            className="rounded-lg px-2 py-1 text-xs text-foreground-muted transition-colors hover:bg-white/5 hover:text-foreground"
            onClick={() => setView("gallery")}
            type="button"
          >
            ← {locale === "zh" ? "模板" : "Templates"}
          </button>
          <span className="h-4 w-px bg-white/10" />
          <span className="font-display-ui text-xl font-bold tracking-tighter text-primary">
            Sentient Flow
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="font-display-ui text-sm text-foreground">
            {graph.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <SignalPill accent="secondary">
            {graph.nodes.length} {locale === "zh" ? "节点" : "nodes"}
          </SignalPill>
          <button
            className={[
              "flex items-center gap-2 rounded-xl px-5 py-1.5 font-display-ui text-sm font-bold transition-all active:scale-95",
              isRunning
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]",
            ].join(" ")}
            onClick={() => void handleRun()}
            type="button"
          >
            <span className="text-sm">
              {isRunning ? "■" : "▶"}
            </span>
            {isRunning ? copy.stop : copy.run}
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left dock - node palette */}
        <nav className="flex w-20 shrink-0 flex-col items-center gap-2 border-r border-white/5 bg-surface-lowest/80 py-4 backdrop-blur-2xl">
          <p className="mb-2 font-label-ui text-[9px] uppercase tracking-[0.2em] text-foreground-muted">
            {copy.palette}
          </p>
          {catalog.map((item) => (
            <PaletteItem key={item.type} item={item} locale={locale} />
          ))}
        </nav>

        {/* Canvas */}
        <div
          className="relative flex-1"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="pointer-events-none absolute left-1/3 top-1/4 z-0 h-72 w-72 rounded-full bg-primary/8 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-1/4 right-1/4 z-0 h-96 w-96 rounded-full bg-secondary/5 blur-[160px]" />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              for (const change of changes) {
                if (change.type === "position" && change.position) {
                  const pos = change.position;
                  setGraph((prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((n) =>
                      n.id === change.id ? { ...n, position: pos } : n,
                    ),
                  }));
                }
              }
            }}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            className="!bg-transparent"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={30}
              size={1}
              color="#333"
            />
            <Controls
              className="!rounded-xl !border !border-white/5 !bg-surface-lowest/80 !backdrop-blur-xl [&>button]:!border-white/5 [&>button]:!bg-transparent [&>button]:!text-foreground-muted [&>button:hover]:!bg-white/5"
              showInteractive={false}
            />
            <MiniMap
              className="!rounded-xl !border !border-white/5 !bg-surface-lowest/80"
              nodeColor="#6366f1"
              maskColor="rgba(0,0,0,0.7)"
            />
          </ReactFlow>
        </div>

        {/* Right panel - config + output */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-white/5 bg-surface-lowest/90">
          {/* Prompt input */}
          <div className="border-b border-white/5 p-4">
            <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">
              {copy.prompt}
            </p>
            <textarea
              className="mt-2 h-20 w-full resize-none rounded-xl border border-white/5 bg-surface-high/60 px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-foreground-muted/50 focus:border-primary/40"
              placeholder={copy.promptPlaceholder}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
            />
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-white/5">
            {([
              { key: "config" as const, label: copy.tabConfig, accent: "primary" },
              { key: "result" as const, label: copy.tabOutput, accent: "secondary" },
              { key: "detail" as const, label: locale === "zh" ? "详情" : "Detail", accent: "tertiary" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                className={[
                  "flex-1 py-2.5 font-label-ui text-[10px] uppercase tracking-[0.18em] transition-colors",
                  rightTab === tab.key
                    ? `border-b-2 border-${tab.accent} text-${tab.accent}`
                    : "text-foreground-muted hover:text-foreground",
                ].join(" ")}
                style={rightTab === tab.key ? {
                  borderColor: tab.accent === "primary" ? "var(--color-primary)" : tab.accent === "secondary" ? "var(--color-secondary)" : "var(--color-tertiary)",
                  color: tab.accent === "primary" ? "var(--color-primary)" : tab.accent === "secondary" ? "var(--color-secondary)" : "var(--color-tertiary)",
                } : undefined}
                onClick={() => setRightTab(tab.key)}
                type="button"
              >
                {tab.label}
                {tab.key === "result" && mainResult && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === "config" && (
              <div className="p-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">{copy.nodeType}</p>
                      <div className="mt-1 rounded-lg bg-surface-high/40 px-3 py-2 text-sm text-foreground-muted">
                        {selectedNode.type}
                      </div>
                    </div>

                    <div>
                      <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">{copy.nodeLabel}</p>
                      <input
                        className="mt-1 w-full rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                        value={selectedNode.label}
                        onChange={(e) => updateNodeInGraph(selectedNode.id, { label: e.target.value })}
                      />
                    </div>

                    {selectedNode.type === "llm" && (
                      <div>
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">{copy.model}</p>
                        <select
                          className="mt-1 w-full rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                          value={String(selectedNode.config?.model ?? "gpt-5")}
                          onChange={(e) => updateNodeInGraph(selectedNode.id, { config: { model: e.target.value } })}
                        >
                          <option value="gpt-5">GPT-5</option>
                          <option value="gpt-5-mini">GPT-5 Mini</option>
                        </select>
                      </div>
                    )}

                    {selectedNode.type === "llm" && (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">{copy.temperature}</p>
                          <span className="font-label-ui text-xs font-bold text-primary">
                            {Number(selectedNode.config?.temperature ?? 0.72).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={Number(selectedNode.config?.temperature ?? 0.72)}
                          onChange={(e) =>
                            updateNodeInGraph(selectedNode.id, { config: { temperature: Number(e.target.value) } })
                          }
                          className="mt-2 w-full accent-primary"
                        />
                      </div>
                    )}

                    {selectedNode.type === "llm" && (
                      <div>
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                          System Prompt
                        </p>
                        <textarea
                          className="mt-1 h-20 w-full resize-none rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none placeholder:text-foreground-muted/40 focus:border-primary/40"
                          placeholder={locale === "zh" ? "留空使用默认 Persona（可用 {{nodeId.output}} 变量）" : "Leave empty for default persona (supports {{nodeId.output}})"}
                          value={String(selectedNode.config?.systemPrompt ?? "")}
                          onChange={(e) => updateNodeInGraph(selectedNode.id, { config: { systemPrompt: e.target.value } })}
                        />
                      </div>
                    )}

                    {selectedNode.type === "llm" && (
                      <div>
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                          User Prompt
                        </p>
                        <textarea
                          className="mt-1 h-20 w-full resize-none rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none placeholder:text-foreground-muted/40 focus:border-primary/40"
                          placeholder={locale === "zh" ? "留空使用全局 Prompt（可用 {{nodeId.output}} 变量）" : "Leave empty to use global prompt (supports {{nodeId.output}})"}
                          value={String(selectedNode.config?.userPrompt ?? "")}
                          onChange={(e) => updateNodeInGraph(selectedNode.id, { config: { userPrompt: e.target.value } })}
                        />
                      </div>
                    )}

                    {selectedNode.type === "tool" && (
                      <div>
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">{copy.toolName}</p>
                        <select
                          className="mt-1 w-full rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                          value={String(selectedNode.config?.toolName ?? "searchKnowledge")}
                          onChange={(e) => updateNodeInGraph(selectedNode.id, { config: { toolName: e.target.value } })}
                        >
                          <option value="searchKnowledge">{locale === "zh" ? "知识检索" : "Search Knowledge"}</option>
                        </select>
                      </div>
                    )}

                    {selectedNode.type === "condition" && (
                      <div>
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                          {locale === "zh" ? "条件表达式" : "Expression"}
                        </p>
                        <input
                          className="mt-1 w-full rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/40"
                          placeholder="output.length > 100"
                          value={String(selectedNode.config?.expression ?? "output.length > 100")}
                          onChange={(e) => updateNodeInGraph(selectedNode.id, { config: { expression: e.target.value } })}
                        />
                        <p className="mt-1 text-[10px] text-foreground-muted/50">
                          {locale === "zh"
                            ? "可用变量: output (上游文本), inputs (所有节点输出对象)"
                            : "Variables: output (upstream text), inputs (all node outputs)"}
                        </p>
                      </div>
                    )}

                    {selectedNode.type === "template" && (
                      <div>
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                          {locale === "zh" ? "文本模板" : "Template"}
                        </p>
                        <textarea
                          className="mt-1 h-32 w-full resize-none rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none placeholder:text-foreground-muted/40 focus:border-primary/40"
                          placeholder={locale === "zh" ? "使用 {{nodeId.output}} 引用其他节点的输出" : "Use {{nodeId.output}} to reference other nodes"}
                          value={String(selectedNode.config?.template ?? "")}
                          onChange={(e) => updateNodeInGraph(selectedNode.id, { config: { template: e.target.value } })}
                        />
                      </div>
                    )}

                    {selectedNode.type === "merge" && (
                      <div>
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                          {locale === "zh" ? "合并策略" : "Merge Strategy"}
                        </p>
                        <select
                          className="mt-1 w-full rounded-lg border border-white/5 bg-surface-high/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                          value={String(selectedNode.config?.strategy ?? "concat")}
                          onChange={(e) => updateNodeInGraph(selectedNode.id, { config: { strategy: e.target.value } })}
                        >
                          <option value="concat">{locale === "zh" ? "拼接全部" : "Concat all"}</option>
                          <option value="first">{locale === "zh" ? "取第一个" : "First only"}</option>
                          <option value="last">{locale === "zh" ? "取最后一个" : "Last only"}</option>
                        </select>
                      </div>
                    )}

                    {execStates.get(selectedNodeId!) && (
                      <div className="mt-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                            {copy.execOutput}
                          </p>
                          <div className="flex items-center gap-2">
                            {execStates.get(selectedNodeId!)?.latencyMs != null && (
                              <span className="text-[10px] text-foreground-muted">
                                {execStates.get(selectedNodeId!)!.latencyMs}ms
                              </span>
                            )}
                            {execStates.get(selectedNodeId!)?.output && (
                              <CopyButton text={execStates.get(selectedNodeId!)!.output!} copy={copy} />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-foreground">
                          {execStates.get(selectedNodeId!)?.output ?? "—"}
                        </div>
                      </div>
                    )}

                    <button
                      className="mt-2 w-full rounded-lg border border-red-500/20 bg-red-500/5 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                      onClick={() => deleteNodeFromGraph(selectedNode.id)}
                      type="button"
                    >
                      {copy.deleteNode}
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-foreground-muted">{copy.noSelection}</p>
                    <p className="mt-2 text-xs text-foreground-muted/60">{copy.noSelectionHint}</p>
                  </div>
                )}
              </div>
            )}

            {rightTab === "result" && (
              <div className="flex h-full flex-col">
                {mainResult ? (
                  <>
                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-green-400">
                          {copy.finalOutput}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {totalLatencyMs != null && (
                          <span className="text-[10px] text-foreground-muted">{totalLatencyMs}ms</span>
                        )}
                        <CopyButton text={mainResult} copy={copy} />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                        {mainResult}
                      </div>
                    </div>
                  </>
                ) : isRunning ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <p className="text-sm text-foreground-muted">{copy.running}</p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
                    <span className="text-3xl opacity-30">▶</span>
                    <p className="text-sm text-foreground-muted">
                      {locale === "zh" ? "输入提示词，点击运行" : "Enter a prompt and click Run"}
                    </p>
                    <p className="text-xs text-foreground-muted/60">
                      {locale === "zh"
                        ? "工作流会依次执行各节点，最终结果将显示在这里"
                        : "The workflow will execute each node in order, and the final result will appear here"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {rightTab === "detail" && (
              <div className="space-y-3 p-4">
                {execStates.size > 0 ? (
                  <>
                    {totalLatencyMs != null && (
                      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                        <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-green-400">
                          {copy.outputSummary}
                        </p>
                        <p className="mt-1 text-xs text-foreground">
                          {completedCount}/{graph.nodes.length} {copy.completed} · {totalLatencyMs}ms
                        </p>
                      </div>
                    )}
                    <p className="font-label-ui text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                      {copy.outputTitle}
                    </p>
                    {graph.nodes.map((n) => {
                      const exec = execStates.get(n.id);
                      if (!exec) return null;
                      return (
                        <OutputNodeCard
                          key={n.id}
                          nodeLabel={n.label}
                          nodeType={n.type}
                          exec={exec}
                          locale={locale}
                          copy={copy}
                        />
                      );
                    })}
                  </>
                ) : (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-foreground-muted">{copy.outputEmpty}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom execution log */}
      <section
        className={[
          "shrink-0 border-t border-white/5 bg-surface-lowest/90 backdrop-blur-xl transition-all duration-300",
          logExpanded ? "h-44" : "h-11",
        ].join(" ")}
      >
        <button
          className="flex h-11 w-full items-center justify-between px-5"
          onClick={() => setLogExpanded(!logExpanded)}
          type="button"
        >
          <div className="flex items-center gap-3">
            <span
              className={[
                "h-2 w-2 rounded-full",
                isRunning
                  ? "bg-secondary animate-pulse shadow-[0_0_10px_rgba(93,230,255,0.5)]"
                  : completedCount > 0
                    ? "bg-green-500"
                    : "bg-foreground-muted/40",
              ].join(" ")}
            />
            <span className="font-label-ui text-[10px] uppercase tracking-[0.22em] text-foreground-muted">
              {copy.executionLog}
            </span>
            {isRunning && (
              <span className="text-[10px] text-foreground-muted">
                {runningCount} {copy.nodesRunning}
              </span>
            )}
            {!isRunning && completedCount > 0 && (
              <span className="text-[10px] text-foreground-muted">
                {completedCount}/{graph.nodes.length} {copy.completed}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {totalLatencyMs != null && (
              <span className="font-label-ui text-[10px] text-foreground-muted">
                {copy.totalLatency}: {totalLatencyMs}ms
              </span>
            )}
            <span
              className={[
                "text-foreground-muted transition-transform",
                logExpanded ? "rotate-180" : "",
              ].join(" ")}
            >
              ▲
            </span>
          </div>
        </button>

        {logExpanded && (
          <div className="h-[calc(100%-2.75rem)] overflow-y-auto px-5 pb-3 font-mono text-[11px]">
            {logEntries.length === 0 ? (
              <p className="text-foreground-muted/50">{copy.emptyLog}</p>
            ) : (
              logEntries.map((entry, i) => (
                <p
                  key={i}
                  className={[
                    "leading-5",
                    entry.type === "success" ? "text-green-400" : "",
                    entry.type === "error" ? "text-red-400" : "",
                    entry.type === "info" ? "text-primary" : "",
                    entry.type === "system" ? "text-foreground-muted" : "",
                  ].join(" ")}
                >
                  <span className="text-foreground-muted/50">[{entry.timestamp}]</span>{" "}
                  {entry.message}
                </p>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        )}
      </section>
    </div>
  );
}

function CopyButton({ text, copy }: { text: string; copy: CopyStrings }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      className="rounded-md px-1.5 py-0.5 text-[10px] text-foreground-muted transition-colors hover:bg-white/10 hover:text-foreground"
      onClick={handleCopy}
      type="button"
    >
      {copied ? copy.copied : copy.copy}
    </button>
  );
}

function OutputNodeCard({
  nodeLabel,
  nodeType,
  exec,
  locale,
  copy,
}: {
  nodeLabel: string;
  nodeType: string;
  exec: NodeExecState;
  locale: string;
  copy: CopyStrings;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasLongOutput = (exec.output?.length ?? 0) > 120;

  const statusColor =
    exec.status === "completed" ? "border-green-500/20 bg-green-500/5" :
    exec.status === "failed" ? "border-red-500/20 bg-red-500/5" :
    exec.status === "running" ? "border-primary/20 bg-primary/5 animate-pulse" :
    "border-white/5 bg-white/[0.02]";
  const statusLabel =
    exec.status === "completed" ? (locale === "zh" ? "✓ 完成" : "✓ Done") :
    exec.status === "failed" ? (locale === "zh" ? "✗ 失败" : "✗ Failed") :
    exec.status === "running" ? (locale === "zh" ? "● 运行中" : "● Running") :
    exec.status === "queued" ? (locale === "zh" ? "○ 等待" : "○ Queued") :
    exec.status;

  const typeIcon =
    nodeType === "trigger" ? "⚡" :
    nodeType === "llm" ? "🧠" :
    nodeType === "condition" ? "🔀" :
    nodeType === "tool" ? "🔧" : "📤";

  return (
    <div className={["rounded-xl border p-3 transition-all", statusColor].join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{typeIcon}</span>
          <span className="text-xs font-semibold text-foreground">{nodeLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {exec.latencyMs != null && (
            <span className="text-[10px] text-foreground-muted/60">{exec.latencyMs}ms</span>
          )}
          <span className="text-[10px] text-foreground-muted">{statusLabel}</span>
        </div>
      </div>

      {exec.output && (
        <>
          <div
            className={[
              "mt-2 overflow-hidden whitespace-pre-wrap text-[11px] leading-[1.6] text-foreground-muted transition-all",
              expanded ? "max-h-[500px] overflow-y-auto" : "max-h-16",
            ].join(" ")}
          >
            {exec.output}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {hasLongOutput && (
              <button
                className="text-[10px] text-primary hover:text-primary/80"
                onClick={() => setExpanded(!expanded)}
                type="button"
              >
                {expanded ? `▲ ${copy.collapse}` : `▼ ${copy.expand}`}
              </button>
            )}
            <CopyButton text={exec.output} copy={copy} />
          </div>
        </>
      )}
    </div>
  );
}

function PaletteItem({ item, locale }: { item: WorkflowNodeCatalogItem; locale: string }) {
  const onDragStart = useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData("application/workflow-node-type", item.type);
      event.dataTransfer.effectAllowed = "move";
    },
    [item.type],
  );

  const accentMap = {
    primary: "text-primary hover:bg-primary/10",
    secondary: "text-secondary hover:bg-secondary/10",
    tertiary: "text-tertiary hover:bg-tertiary/10",
  };

  return (
    <button
      className={[
        "flex w-16 cursor-grab flex-col items-center gap-1 rounded-xl p-2 transition-all active:cursor-grabbing active:scale-95",
        accentMap[item.accent],
      ].join(" ")}
      draggable
      onDragStart={onDragStart}
      title={item.description}
      type="button"
    >
      <span className="font-display-ui text-lg font-semibold">{
        item.icon === "bolt" ? "⚡" :
        item.icon === "psychology" ? "🧠" :
        item.icon === "call_split" ? "🔀" :
        item.icon === "extension" ? "🔧" :
        item.icon === "template" ? "📋" :
        item.icon === "merge" ? "🔗" :
        "📤"
      }</span>
      <span className="font-label-ui text-[9px] uppercase tracking-wider">
        {item.label}
      </span>
    </button>
  );
}

