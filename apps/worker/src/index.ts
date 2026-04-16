import { evolutionActionSchema } from "../../../packages/ai/src/demo-evolution";
import { jobIdSchema } from "../../../packages/ai/src/jobs/demo-jobs";
import { runEvolution } from "../../../packages/ai/src/evolution/runner";
import {
  claimNextQueuedJob,
  completeJobRun,
  failJobRun,
  peekNextQueuedJob,
  upsertWorkerHeartbeat,
} from "../../../packages/db/src/repos/job-runs";
import {
  claimNextQueuedEvolutionRun,
  completeEvolutionRun,
  failEvolutionRun,
  peekNextQueuedEvolutionRun,
} from "../../../packages/db/src/repos/evolution-runs";
import { runWorkerJob } from "./jobs";

const DEFAULT_POLL_INTERVAL_MS = 1500;
const workerId = `worker-${process.pid}`;

let isProcessing = false;

function resolvePollIntervalMs() {
  const parsed = Number.parseInt(
    process.env.WORKER_POLL_INTERVAL_MS ?? `${DEFAULT_POLL_INTERVAL_MS}`,
    10,
  );

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_POLL_INTERVAL_MS;
  }

  return parsed;
}

async function processNextRun() {
  if (isProcessing) {
    return;
  }

  await upsertWorkerHeartbeat({ workerId });

  const claimedRun = await claimNextQueueItem();

  if (!claimedRun) {
    return;
  }

  isProcessing = true;

  try {
    if (claimedRun.kind === "job") {
      const parsedJobId = jobIdSchema.safeParse(claimedRun.run.jobId);

      if (!parsedJobId.success) {
        throw new Error(`Unsupported job id: ${claimedRun.run.jobId}`);
      }

      console.log("[worker] claimed job run", {
        jobId: claimedRun.run.jobId,
        runId: claimedRun.run.id,
        workerId,
      });

      const result = await runWorkerJob(parsedJobId.data, claimedRun.run.locale);

      await completeJobRun({
        result: result as unknown as Record<string, unknown>,
        runId: claimedRun.run.id,
      });

      console.log("[worker] completed job run", {
        jobId: claimedRun.run.jobId,
        runId: claimedRun.run.id,
      });
      return;
    }

    const parsedAction = evolutionActionSchema.safeParse(claimedRun.run.action);

    if (!parsedAction.success) {
      throw new Error(`Unsupported evolution action: ${claimedRun.run.action}`);
    }

    console.log("[worker] claimed evolution run", {
      action: claimedRun.run.action,
      runId: claimedRun.run.id,
      workerId,
    });

    const result = await runEvolution({
      action: parsedAction.data,
      locale: claimedRun.run.locale,
    });

    await completeEvolutionRun({
      result: {
        ...result,
        logLines: buildEvolutionLogLines({
          action: claimedRun.run.action,
          locale: claimedRun.run.locale,
          status: "completed",
          summary: result.summary,
        }),
      },
      runId: claimedRun.run.id,
    });

    console.log("[worker] completed evolution run", {
      action: claimedRun.run.action,
      runId: claimedRun.run.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown worker execution error.";

    if (claimedRun.kind === "job") {
      await failJobRun({
        error: message,
        runId: claimedRun.run.id,
      });
      console.error("[worker] failed job run", {
        error: message,
        jobId: claimedRun.run.jobId,
        runId: claimedRun.run.id,
      });
    } else {
      await failEvolutionRun({
        error: message,
        logLines: buildEvolutionLogLines({
          action: claimedRun.run.action,
          locale: claimedRun.run.locale,
          status: "failed",
          summary: message,
        }),
        runId: claimedRun.run.id,
      });
      console.error("[worker] failed evolution run", {
        action: claimedRun.run.action,
        error: message,
        runId: claimedRun.run.id,
      });
    }
  } finally {
    isProcessing = false;
  }
}

async function main() {
  const pollIntervalMs = resolvePollIntervalMs();

  await upsertWorkerHeartbeat({ workerId });
  console.log("[worker] queue processor ready", {
    pollIntervalMs,
    workerId,
  });

  await processNextRun();

  setInterval(() => {
    void processNextRun();
  }, pollIntervalMs);
}

main().catch((error) => {
  console.error("[worker] fatal error", error);
  process.exit(1);
});

function parseCreatedAt(createdAt: string) {
  const parsed = Date.parse(createdAt);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function buildEvolutionLogLines(args: {
  action: string;
  locale: "zh" | "en";
  status: "completed" | "failed";
  summary?: string;
}) {
  const base =
    args.status === "completed"
      ? args.locale === "zh"
        ? [
            `[worker] ${args.action} claimed on ${workerId}`,
            `[worker] ${args.action} executed in background`,
            `[done] ${args.summary ?? `${args.action} completed`}`,
          ]
        : [
            `[worker] ${args.action} claimed on ${workerId}`,
            `[worker] ${args.action} executed in background`,
            `[done] ${args.summary ?? `${args.action} completed`}`,
          ]
      : args.locale === "zh"
        ? [
            `[worker] ${args.action} claimed on ${workerId}`,
            `[worker] ${args.action} failed in background`,
            `[error] ${args.summary ?? `${args.action} failed`}`,
          ]
        : [
            `[worker] ${args.action} claimed on ${workerId}`,
            `[worker] ${args.action} failed in background`,
            `[error] ${args.summary ?? `${args.action} failed`}`,
          ];

  return [...base, "_"];
}

async function claimNextQueueItem() {
  const [nextJobRun, nextEvolutionRun] = await Promise.all([
    peekNextQueuedJob(),
    peekNextQueuedEvolutionRun(),
  ]);

  if (!nextJobRun && !nextEvolutionRun) {
    return null;
  }

  if (nextJobRun && nextEvolutionRun) {
    if (parseCreatedAt(nextJobRun.createdAt) <= parseCreatedAt(nextEvolutionRun.createdAt)) {
      const claimedJobRun = await claimNextQueuedJob({ workerId });

      if (claimedJobRun) {
        return {
          kind: "job" as const,
          run: claimedJobRun,
        };
      }

      const claimedEvolutionRun = await claimNextQueuedEvolutionRun({ workerId });
      return claimedEvolutionRun
        ? {
            kind: "evolution" as const,
            run: claimedEvolutionRun,
          }
        : null;
    }

    const claimedEvolutionRun = await claimNextQueuedEvolutionRun({ workerId });

    if (claimedEvolutionRun) {
      return {
        kind: "evolution" as const,
        run: claimedEvolutionRun,
      };
    }

    const claimedJobRun = await claimNextQueuedJob({ workerId });
    return claimedJobRun
      ? {
          kind: "job" as const,
          run: claimedJobRun,
        }
      : null;
  }

  if (nextJobRun) {
    const claimedJobRun = await claimNextQueuedJob({ workerId });
    return claimedJobRun
      ? {
          kind: "job" as const,
          run: claimedJobRun,
        }
      : null;
  }

  const claimedEvolutionRun = await claimNextQueuedEvolutionRun({ workerId });
  return claimedEvolutionRun
    ? {
        kind: "evolution" as const,
        run: claimedEvolutionRun,
      }
    : null;
}
