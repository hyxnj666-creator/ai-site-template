import { runJob } from "../../../../packages/ai/src/jobs/runner";

export async function syncBlogJob(locale: "zh" | "en" = "en") {
  return runJob({
    jobId: "blog-sync",
    locale,
  });
}
