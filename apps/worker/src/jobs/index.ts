import type { JobId } from "../../../../packages/ai/src/jobs/demo-jobs";
import { aggregateMetricsJob } from "./aggregate-metrics";
import { generateWeeklyDigestJob } from "./generate-weekly-digest";
import { ingestKnowledgeJob } from "./ingest-knowledge";
import { rebuildCodingDnaJob } from "./rebuild-coding-dna";
import { syncBlogJob } from "./sync-blog";
import { syncGithubJob } from "./sync-github";

const workerJobRunners: Record<
  JobId,
  (locale: "zh" | "en") => Promise<Record<string, unknown>>
> = {
  "aggregate-metrics": aggregateMetricsJob,
  "blog-sync": syncBlogJob,
  "github-sync": syncGithubJob,
  "ingest-knowledge": ingestKnowledgeJob,
  "rebuild-coding-dna": rebuildCodingDnaJob,
  "weekly-digest": generateWeeklyDigestJob,
};

export function runWorkerJob(jobId: JobId, locale: "zh" | "en") {
  return workerJobRunners[jobId](locale);
}
