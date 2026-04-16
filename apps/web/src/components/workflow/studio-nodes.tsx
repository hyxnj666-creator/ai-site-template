"use client";

import type { WorkflowNodeType, NodeExecutionStatus } from "@ai-site/ai";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";

const typeConfig: Record<
  WorkflowNodeType,
  { accentDot: string; accentBorder: string; eyebrowColor: string; eyebrow: Record<string, string> }
> = {
  trigger: {
    accentDot: "bg-secondary shadow-[0_0_8px_rgba(93,230,255,0.6)]",
    accentBorder: "border-secondary/25",
    eyebrowColor: "text-secondary",
    eyebrow: { zh: "触发器", en: "Trigger" },
  },
  llm: {
    accentDot: "bg-primary shadow-[0_0_10px_rgba(208,188,255,0.6)]",
    accentBorder: "border-primary/30",
    eyebrowColor: "text-primary",
    eyebrow: { zh: "推理", en: "Inference" },
  },
  condition: {
    accentDot: "bg-tertiary shadow-[0_0_8px_rgba(255,185,95,0.6)]",
    accentBorder: "border-tertiary/25",
    eyebrowColor: "text-tertiary",
    eyebrow: { zh: "逻辑", en: "Logic" },
  },
  tool: {
    accentDot: "bg-primary shadow-[0_0_8px_rgba(208,188,255,0.5)]",
    accentBorder: "border-primary/20",
    eyebrowColor: "text-primary",
    eyebrow: { zh: "工具", en: "Tool" },
  },
  template: {
    accentDot: "bg-tertiary shadow-[0_0_8px_rgba(255,185,95,0.5)]",
    accentBorder: "border-tertiary/20",
    eyebrowColor: "text-tertiary",
    eyebrow: { zh: "模板", en: "Template" },
  },
  merge: {
    accentDot: "bg-secondary shadow-[0_0_8px_rgba(93,230,255,0.5)]",
    accentBorder: "border-secondary/20",
    eyebrowColor: "text-secondary",
    eyebrow: { zh: "合并", en: "Merge" },
  },
  output: {
    accentDot: "bg-secondary shadow-[0_0_8px_rgba(93,230,255,0.5)]",
    accentBorder: "border-secondary/20",
    eyebrowColor: "text-secondary",
    eyebrow: { zh: "输出", en: "Output" },
  },
};

const statusBadge: Record<NodeExecutionStatus, { bg: string; text: string; label: Record<string, string> }> = {
  queued: { bg: "bg-white/5", text: "text-foreground-muted", label: { zh: "等待", en: "Queued" } },
  running: { bg: "bg-primary/15", text: "text-primary", label: { zh: "运行中", en: "Running" } },
  completed: { bg: "bg-green-500/15", text: "text-green-400", label: { zh: "完成", en: "Done" } },
  failed: { bg: "bg-red-500/15", text: "text-red-400", label: { zh: "失败", en: "Failed" } },
  skipped: { bg: "bg-white/5", text: "text-foreground-muted", label: { zh: "跳过", en: "Skipped" } },
};

export interface StudioNodeData {
  label: string;
  nodeType: WorkflowNodeType;
  locale: string;
  executionStatus?: NodeExecutionStatus;
  executionOutput?: string;
  selected?: boolean;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

function StudioNodeInner({ data, selected }: NodeProps & { data: StudioNodeData }) {
  const cfg = typeConfig[data.nodeType] || typeConfig.trigger;
  const locale = data.locale === "zh" ? "zh" : "en";
  const execStatus = data.executionStatus;
  const sBadge = execStatus ? statusBadge[execStatus] : null;

  const isRunning = execStatus === "running";

  return (
    <div
      className={[
        "group relative min-w-[180px] max-w-[240px] rounded-2xl border p-4 backdrop-blur-xl transition-all duration-300",
        "bg-[rgba(28,27,27,0.75)]",
        cfg.accentBorder,
        selected ? "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(208,188,255,0.15)]" : "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        isRunning ? "animate-pulse" : "",
      ].join(" ")}
    >
      {data.nodeType !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !rounded-full !bg-surface-high !border-2 !border-foreground-muted/40 !-left-1.5"
        />
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={["h-2 w-2 rounded-full", cfg.accentDot].join(" ")} />
          <span className={["font-display-ui text-[10px] font-bold uppercase tracking-[0.18em]", cfg.eyebrowColor].join(" ")}>
            {cfg.eyebrow[locale]}
          </span>
        </div>
        {sBadge && (
          <span className={["rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", sBadge.bg, sBadge.text].join(" ")}>
            {sBadge.label[locale]}
          </span>
        )}
      </div>

      <h4 className="font-display-ui text-sm font-semibold tracking-tight text-foreground">
        {data.label}
      </h4>

      {data.config?.model != null ? (
        <p className="mt-1 text-[10px] text-foreground-muted">{String(data.config.model)}</p>
      ) : null}
      {data.nodeType === "template" && data.config?.template ? (
        <p className="mt-1 max-h-8 overflow-hidden text-[10px] font-mono text-foreground-muted/60">
          {String(data.config.template).slice(0, 60)}{String(data.config.template).length > 60 ? "…" : ""}
        </p>
      ) : null}
      {data.nodeType === "merge" && data.config?.strategy ? (
        <p className="mt-1 text-[10px] text-foreground-muted">{String(data.config.strategy)}</p>
      ) : null}
      {data.nodeType === "condition" && data.config?.expression ? (
        <p className="mt-1 text-[10px] font-mono text-foreground-muted/60">{String(data.config.expression)}</p>
      ) : null}

      {data.executionOutput && (
        <p className="mt-2 max-h-16 overflow-hidden text-[11px] leading-4 text-foreground-muted opacity-80">
          {data.executionOutput.slice(0, 120)}
          {data.executionOutput.length > 120 ? "..." : ""}
        </p>
      )}

      {data.nodeType === "condition" ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="success"
            className="!w-3 !h-3 !rounded-full !bg-surface-high !border-2 !border-green-500 !-right-1.5 !top-[35%]"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="fail"
            className="!w-3 !h-3 !rounded-full !bg-surface-high !border-2 !border-red-500/40 !-right-1.5 !top-[65%]"
          />
        </>
      ) : data.nodeType !== "output" ? (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !rounded-full !bg-surface-high !border-2 !border-primary/50 !-right-1.5"
        />
      ) : null}
    </div>
  );
}

export const StudioNode = memo(StudioNodeInner);
