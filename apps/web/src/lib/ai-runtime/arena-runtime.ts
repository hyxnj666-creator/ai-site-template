import {
  type ArenaRunRequest,
  type ArenaStreamEvent,
  arenaModelLabels,
} from "@ai-site/ai";
import { retrieveKnowledge } from "@/lib/chat/knowledge";
import {
  buildProjectAwareSystemPrompt,
  compactPrompt,
  createModelInstance,
  streamText,
  toChatSources,
} from "./shared";

const BATCH_INTERVAL_MS = 50;

type QueueItem =
  | { kind: "delta"; side: "left" | "right"; text: string }
  | { kind: "done"; side: "left" | "right"; latencyMs: number; tokenCount: number }
  | { kind: "error"; side: "left" | "right"; message: string };

export function streamArenaComparison(request: ArenaRunRequest): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let closed = false;

      const push = (event: ArenaStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          closed = true;
        }
      };

      try {
        push({
          type: "start",
          leftModel: arenaModelLabels[request.leftModel],
          rightModel: arenaModelLabels[request.rightModel],
        });

        const knowledgeHits = await retrieveKnowledge({
          limit: 4,
          locale: request.locale,
          query: request.prompt,
        });

        push({ type: "sources", sources: toChatSources(knowledgeHits) });

        const leftModel = createModelInstance(request.leftModel);
        const rightModel = createModelInstance(request.rightModel);

        const systemLeft = buildProjectAwareSystemPrompt({
          knowledgeHits,
          locale: request.locale,
          styleInstruction:
            request.locale === "zh"
              ? "给出更深入、更具因果链的答案；适当展开，但不要空泛。用中文回答。"
              : "Answer with depth and reasoning structure. Explain the why, not only the what.",
          taskLabel: `Arena ${arenaModelLabels[request.leftModel]} - depth answer`,
        });

        const systemRight = buildProjectAwareSystemPrompt({
          knowledgeHits,
          locale: request.locale,
          styleInstruction:
            request.locale === "zh"
              ? "给出更清晰、更压缩、便于读者快速吸收的答案。用中文回答。"
              : "Answer with clarity and compression. Make it easy to absorb quickly.",
          taskLabel: `Arena ${arenaModelLabels[request.rightModel]} - clarity answer`,
        });

        /* ----------------------------------------------------------------
         * Start BOTH API requests simultaneously as floating async tasks
         * feeding a shared queue. The main loop drains the queue whenever
         * signaled, ensuring neither side blocks the other.
         * ---------------------------------------------------------------- */

        const queue: QueueItem[] = [];
        let wakeUp: (() => void) | null = null;
        const signal = () => { wakeUp?.(); wakeUp = null; };

        let leftRunning = !!leftModel;
        let rightRunning = !!rightModel;

        if (!leftModel) {
          push({
            type: "left_delta",
            text: request.locale === "zh"
              ? `${arenaModelLabels[request.leftModel]} 当前不可用，API Key 未配置。`
              : `${arenaModelLabels[request.leftModel]} is unavailable (API key not configured).`,
          });
          push({ type: "left_done", latencyMs: 0, tokenCount: 0, mode: "fallback" });
        }

        if (!rightModel) {
          push({
            type: "right_delta",
            text: request.locale === "zh"
              ? `${arenaModelLabels[request.rightModel]} 当前不可用，API Key 未配置。`
              : `${arenaModelLabels[request.rightModel]} is unavailable (API key not configured).`,
          });
          push({ type: "right_done", latencyMs: 0, tokenCount: 0, mode: "fallback" });
        }

        // Left floating consumer
        if (leftModel) {
          const startTime = Date.now();
          let tokenCount = 0;
          void (async () => {
            try {
              const result = streamText({ model: leftModel, system: systemLeft, prompt: request.prompt });
              for await (const delta of result.textStream) {
                queue.push({ kind: "delta", side: "left", text: delta });
                signal();
                tokenCount++;
              }
              queue.push({ kind: "done", side: "left", latencyMs: Date.now() - startTime, tokenCount });
            } catch (e) {
              console.error("Arena left stream error:", e);
              queue.push({ kind: "error", side: "left", message: e instanceof Error ? e.message : "Unknown error" });
            }
            signal();
          })();
        }

        // Right floating consumer
        if (rightModel) {
          const startTime = Date.now();
          let tokenCount = 0;
          void (async () => {
            try {
              const result = streamText({ model: rightModel, system: systemRight, prompt: request.prompt });
              for await (const delta of result.textStream) {
                queue.push({ kind: "delta", side: "right", text: delta });
                signal();
                tokenCount++;
              }
              queue.push({ kind: "done", side: "right", latencyMs: Date.now() - startTime, tokenCount });
            } catch (e) {
              console.error("Arena right stream error:", e);
              queue.push({ kind: "error", side: "right", message: e instanceof Error ? e.message : "Unknown error" });
            }
            signal();
          })();
        }

        // Drain loop: processes queue items, waits for signal when empty
        let leftBuf = "";
        let rightBuf = "";
        let leftFlush = Date.now();
        let rightFlush = Date.now();

        while (leftRunning || rightRunning) {
          while (queue.length > 0) {
            const item = queue.shift()!;

            if (item.kind === "done") {
              const side = item.side;
              if (side === "left") {
                if (leftBuf) { push({ type: "left_delta", text: leftBuf }); leftBuf = ""; }
                push({ type: "left_done", latencyMs: item.latencyMs, tokenCount: item.tokenCount, mode: "live" });
                leftRunning = false;
              } else {
                if (rightBuf) { push({ type: "right_delta", text: rightBuf }); rightBuf = ""; }
                push({ type: "right_done", latencyMs: item.latencyMs, tokenCount: item.tokenCount, mode: "live" });
                rightRunning = false;
              }
            } else if (item.kind === "error") {
              const text = request.locale === "zh"
                ? `生成失败：${item.message}`
                : `Generation failed: ${item.message}`;
              if (item.side === "left") {
                push({ type: "left_delta", text });
                push({ type: "left_done", latencyMs: 0, tokenCount: 0, mode: "fallback" });
                leftRunning = false;
              } else {
                push({ type: "right_delta", text });
                push({ type: "right_done", latencyMs: 0, tokenCount: 0, mode: "fallback" });
                rightRunning = false;
              }
            } else {
              // delta
              const now = Date.now();
              if (item.side === "left") {
                leftBuf += item.text;
                if (now - leftFlush >= BATCH_INTERVAL_MS || leftBuf.length > 80) {
                  push({ type: "left_delta", text: leftBuf });
                  leftBuf = "";
                  leftFlush = now;
                }
              } else {
                rightBuf += item.text;
                if (now - rightFlush >= BATCH_INTERVAL_MS || rightBuf.length > 80) {
                  push({ type: "right_delta", text: rightBuf });
                  rightBuf = "";
                  rightFlush = now;
                }
              }
            }
          }

          if (leftRunning || rightRunning) {
            // Wait until a consumer pushes something — safe because JS is single-threaded:
            // no item can be pushed between queue.length === 0 and this await.
            await new Promise<void>((r) => { wakeUp = r; });
          }
        }

        push({
          type: "done",
          summary:
            request.locale === "zh"
              ? `${arenaModelLabels[request.leftModel]} vs ${arenaModelLabels[request.rightModel]}，围绕「${compactPrompt(request.prompt, 64)}」的对决完成。`
              : `${arenaModelLabels[request.leftModel]} vs ${arenaModelLabels[request.rightModel]} battle on "${compactPrompt(request.prompt, 64)}" complete.`,
        });
      } catch (error) {
        console.error("Arena stream error:", error);
        push({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        if (!closed) {
          closed = true;
          try { controller.close(); } catch { /* already closed */ }
        }
      }
    },
  });
}
