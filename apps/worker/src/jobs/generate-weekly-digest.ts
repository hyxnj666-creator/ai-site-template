import { runJob } from "../../../../packages/ai/src/jobs/runner";

export async function generateWeeklyDigestJob(locale: "zh" | "en" = "en") {
  return runJob({
    jobId: "weekly-digest",
    locale,
  });
}
