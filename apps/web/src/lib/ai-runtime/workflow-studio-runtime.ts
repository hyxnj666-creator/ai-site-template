import type {
  WorkflowStudioRunRequest,
  WorkflowGraph,
  WorkflowNode,
  NodeExecutionStatus,
} from "@ai-site/ai";
import { resolveVariables, personaPrompt, safetyRules } from "@ai-site/ai";
import { retrieveKnowledge } from "@/lib/chat/knowledge";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

interface NodeEvent {
  type: "node_status";
  nodeId: string;
  status: NodeExecutionStatus;
  output?: string;
  latencyMs?: number;
}

interface WorkflowDoneEvent {
  type: "workflow_done";
  summary: string;
  totalLatencyMs: number;
}

interface WorkflowErrorEvent {
  type: "workflow_error";
  error: string;
}

type StudioEvent = NodeEvent | WorkflowDoneEvent | WorkflowErrorEvent;

function encode(event: StudioEvent): string {
  return JSON.stringify(event) + "\n";
}

// ---------------------------------------------------------------------------
// Graph utilities
// ---------------------------------------------------------------------------

function buildAdjacency(graph: WorkflowGraph) {
  const children = new Map<string, { target: string; sourceHandle?: string }[]>();
  const parents = new Map<string, string[]>();
  for (const node of graph.nodes) {
    children.set(node.id, []);
    parents.set(node.id, []);
  }
  for (const edge of graph.edges) {
    children.get(edge.source)?.push({ target: edge.target, sourceHandle: edge.sourceHandle });
    parents.get(edge.target)?.push(edge.source);
  }
  return { children, parents };
}

// ---------------------------------------------------------------------------
// Node executors
// ---------------------------------------------------------------------------

interface ExecContext {
  node: WorkflowNode;
  prompt: string;
  locale: "zh" | "en";
  upstreamOutputs: Map<string, string>;
  allOutputs: Map<string, string>;
  graph: WorkflowGraph;
}

interface ExecResult {
  output: string;
  latencyMs: number;
  branchResult?: boolean;
}

async function executeTrigger(ctx: ExecContext): Promise<ExecResult> {
  return { output: ctx.prompt, latencyMs: 0 };
}

async function executeTool(ctx: ExecContext): Promise<ExecResult> {
  const start = Date.now();
  const toolName = String(ctx.node.config?.toolName ?? "searchKnowledge");
  if (toolName === "searchKnowledge") {
    const query = resolveVariables(ctx.prompt, ctx.allOutputs);
    const hits = await retrieveKnowledge({ query, locale: ctx.locale, limit: 6 });
    if (hits.length === 0) {
      return {
        output: ctx.locale === "zh" ? "未检索到相关知识。" : "No relevant knowledge found.",
        latencyMs: Date.now() - start,
      };
    }
    const sections = hits.map((h, i) => `[${i + 1}] ${h.title}\n${h.snippet}`);
    return { output: sections.join("\n\n"), latencyMs: Date.now() - start };
  }
  return {
    output: ctx.locale === "zh" ? `工具 ${toolName} 暂未实现。` : `Tool ${toolName} not implemented.`,
    latencyMs: Date.now() - start,
  };
}

async function executeLLM(ctx: ExecContext): Promise<ExecResult> {
  const start = Date.now();
  const config = ctx.node.config ?? {};
  const model = String(config.model ?? "gpt-5.4");
  const temperature = Number(config.temperature ?? 0.72);
  const customSystem = String(config.systemPrompt ?? "");
  const customUser = String(config.userPrompt ?? "");

  const resolvedModel = model === "gpt-5-mini"
    ? (process.env.OPENAI_FAST_CHAT_MODEL || "gpt-5.4-mini")
    : (process.env.OPENAI_CHAT_MODEL || "gpt-5.4");

  const userPrompt = customUser
    ? resolveVariables(customUser, ctx.allOutputs)
    : ctx.prompt;

  const upstreamTexts = Array.from(ctx.upstreamOutputs.values()).filter(Boolean);
  const contextBlock = upstreamTexts.length > 0 ? upstreamTexts.join("\n\n---\n\n") : "";

  if (!process.env.OPENAI_API_KEY) {
    return {
      output: ctx.locale === "zh"
        ? `[Demo] API Key 未配置，无法调用 ${resolvedModel}。`
        : `[Demo] No API key, cannot call ${resolvedModel}.`,
      latencyMs: Date.now() - start,
    };
  }

  try {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    const systemParts: string[] = [personaPrompt];

    if (customSystem) {
      systemParts.push(resolveVariables(customSystem, ctx.allOutputs));
    } else {
      systemParts.push(
        ctx.locale === "zh"
          ? "你是工作流中的 LLM 推理节点。根据用户指令和参考资料生成完整、高质量的结果。直接输出内容，不要元描述。"
          : "You are an LLM node in a workflow. Generate complete, high-quality results based on the instruction and reference material. Output content directly.",
      );
    }

    systemParts.push(safetyRules);

    if (contextBlock && !customUser) {
      systemParts.push(
        ctx.locale === "zh"
          ? `参考资料：\n\n${contextBlock}`
          : `Reference material:\n\n${contextBlock}`,
      );
    }

    const result = await generateText({
      model: openai(resolvedModel),
      prompt: userPrompt,
      system: systemParts.join("\n\n"),
      temperature,
    });

    return {
      output: result.text.trim() || (ctx.locale === "zh" ? "LLM 未返回有效输出" : "LLM returned empty output"),
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      output: ctx.locale === "zh"
        ? `LLM 调用失败：${err instanceof Error ? err.message : "未知错误"}`
        : `LLM call failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      latencyMs: Date.now() - start,
    };
  }
}

function executeCondition(ctx: ExecContext): ExecResult {
  const start = Date.now();
  const expression = String(ctx.node.config?.expression ?? "output.length > 100");
  const upstreamText = Array.from(ctx.upstreamOutputs.values()).join(" ");

  let passed = false;
  try {
    const fn = new Function("output", "inputs", `return Boolean(${expression})`);
    const inputs: Record<string, string> = {};
    for (const [k, v] of ctx.allOutputs) inputs[k] = v;
    passed = fn(upstreamText, inputs) as boolean;
  } catch {
    passed = upstreamText.length > 100;
  }

  return {
    output: ctx.locale === "zh"
      ? `条件判断 ${passed ? "✓ 通过" : "✗ 未通过"}：${expression}`
      : `Condition ${passed ? "✓ passed" : "✗ failed"}: ${expression}`,
    latencyMs: Date.now() - start,
    branchResult: passed,
  };
}

function executeTemplate(ctx: ExecContext): ExecResult {
  const start = Date.now();
  const template = String(ctx.node.config?.template ?? "");
  if (!template) {
    return {
      output: ctx.locale === "zh" ? "模板为空" : "Template is empty",
      latencyMs: Date.now() - start,
    };
  }
  const resolved = resolveVariables(template, ctx.allOutputs);
  return { output: resolved, latencyMs: Date.now() - start };
}

function executeMerge(ctx: ExecContext): ExecResult {
  const start = Date.now();
  const strategy = String(ctx.node.config?.strategy ?? "concat");
  const texts = Array.from(ctx.upstreamOutputs.values()).filter(Boolean);

  let output: string;
  switch (strategy) {
    case "first":
      output = texts[0] ?? "";
      break;
    case "last":
      output = texts[texts.length - 1] ?? "";
      break;
    default:
      output = texts.join("\n\n---\n\n");
  }

  return { output, latencyMs: Date.now() - start };
}

function executeOutput(ctx: ExecContext): ExecResult {
  const start = Date.now();
  const llmNodes = new Set(ctx.graph.nodes.filter((n) => n.type === "llm").map((n) => n.id));

  const llmOutputs: string[] = [];
  for (const [nId, text] of ctx.allOutputs) {
    if (llmNodes.has(nId) && text) llmOutputs.push(text);
  }

  if (llmOutputs.length > 0) {
    return { output: llmOutputs.join("\n\n---\n\n"), latencyMs: Date.now() - start };
  }

  const allTexts = Array.from(ctx.allOutputs.values()).filter((t) => t && t !== ctx.prompt);
  if (allTexts.length > 0) {
    const longest = allTexts.reduce((a, b) => (a.length >= b.length ? a : b));
    return { output: longest, latencyMs: Date.now() - start };
  }

  return {
    output: ctx.locale === "zh" ? "无可用输出。" : "No output available.",
    latencyMs: Date.now() - start,
  };
}

async function executeNode(ctx: ExecContext): Promise<ExecResult> {
  switch (ctx.node.type) {
    case "trigger": return executeTrigger(ctx);
    case "tool": return executeTool(ctx);
    case "llm": return executeLLM(ctx);
    case "condition": return executeCondition(ctx);
    case "template": return executeTemplate(ctx);
    case "merge": return executeMerge(ctx);
    case "output": return executeOutput(ctx);
    default: return { output: "Unknown node type", latencyMs: 0 };
  }
}

// ---------------------------------------------------------------------------
// Main engine: parallel execution + real branching
// ---------------------------------------------------------------------------

export function runWorkflowStudio(request: WorkflowStudioRunRequest): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { graph, locale, prompt } = request;

  return new ReadableStream({
    async start(controller) {
      const totalStart = Date.now();
      const nodeOutputs = new Map<string, string>();
      const skippedNodes = new Set<string>();
      const completedNodes = new Set<string>();
      const { children, parents } = buildAdjacency(graph);
      const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

      const emit = (event: StudioEvent) => {
        controller.enqueue(encoder.encode(encode(event)));
      };

      try {
        for (const node of graph.nodes) {
          emit({ type: "node_status", nodeId: node.id, status: "queued" });
        }

        const isReady = (nodeId: string) => {
          const deps = parents.get(nodeId) ?? [];
          return deps.every((p) => completedNodes.has(p) || skippedNodes.has(p));
        };

        const remaining = new Set(graph.nodes.map((n) => n.id));

        while (remaining.size > 0) {
          const readyBatch: string[] = [];
          for (const nId of remaining) {
            if (isReady(nId)) readyBatch.push(nId);
          }

          if (readyBatch.length === 0) break;

          const batchPromises = readyBatch.map(async (nId) => {
            remaining.delete(nId);
            const node = nodeMap.get(nId);
            if (!node) return;

            if (skippedNodes.has(nId)) {
              emit({ type: "node_status", nodeId: nId, status: "skipped" });
              return;
            }

            emit({ type: "node_status", nodeId: nId, status: "running" });

            const upstreamEdges = graph.edges.filter((e) => e.target === nId);
            const upstreamOutputs = new Map<string, string>();
            for (const edge of upstreamEdges) {
              const out = nodeOutputs.get(edge.source);
              if (out) upstreamOutputs.set(edge.source, out);
            }

            try {
              const result = await executeNode({
                node,
                prompt,
                locale,
                upstreamOutputs,
                allOutputs: nodeOutputs,
                graph,
              });

              nodeOutputs.set(nId, result.output);
              completedNodes.add(nId);

              emit({
                type: "node_status",
                nodeId: nId,
                status: "completed",
                output: result.output,
                latencyMs: result.latencyMs,
              });

              if (node.type === "condition" && result.branchResult !== undefined) {
                const activeHandle = result.branchResult ? "success" : "fail";
                const nodeChildren = children.get(nId) ?? [];
                for (const child of nodeChildren) {
                  if (child.sourceHandle && child.sourceHandle !== activeHandle) {
                    markSkipped(child.target, skippedNodes, children);
                  }
                }
              }
            } catch (err) {
              completedNodes.add(nId);
              emit({
                type: "node_status",
                nodeId: nId,
                status: "failed",
                output: err instanceof Error ? err.message : "Unknown error",
              });
            }
          });

          await Promise.all(batchPromises);
        }

        emit({
          type: "workflow_done",
          summary: locale === "zh"
            ? `工作流「${graph.name}」执行完成`
            : `Workflow "${graph.name}" completed`,
          totalLatencyMs: Date.now() - totalStart,
        });
      } catch (err) {
        emit({
          type: "workflow_error",
          error: err instanceof Error ? err.message : "Workflow execution failed",
        });
      } finally {
        controller.close();
      }
    },
  });
}

function markSkipped(
  nodeId: string,
  skippedNodes: Set<string>,
  children: Map<string, { target: string; sourceHandle?: string }[]>,
) {
  if (skippedNodes.has(nodeId)) return;
  skippedNodes.add(nodeId);
  for (const child of children.get(nodeId) ?? []) {
    markSkipped(child.target, skippedNodes, children);
  }
}
