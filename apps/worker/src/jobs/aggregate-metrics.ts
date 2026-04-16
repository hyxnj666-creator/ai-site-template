import { runJob } from "../../../../packages/ai/src/jobs/runner";

export async function aggregateMetricsJob(locale: "zh" | "en" = "en") {
  return runJob({
    jobId: "aggregate-metrics",
    locale,
  });
}
