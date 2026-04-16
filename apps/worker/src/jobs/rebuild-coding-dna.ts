import { runJob } from "../../../../packages/ai/src/jobs/runner";

export async function rebuildCodingDnaJob(locale: "zh" | "en" = "en") {
  return runJob({
    jobId: "rebuild-coding-dna",
    locale,
  });
}
