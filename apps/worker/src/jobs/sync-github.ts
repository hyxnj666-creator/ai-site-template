import { runJob } from "../../../../packages/ai/src/jobs/runner";

export async function syncGithubJob(locale: "zh" | "en" = "en") {
  return runJob({
    jobId: "github-sync",
    locale,
  });
}
