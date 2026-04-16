import { ingestAllKnowledge, type EmbedFn } from "../../../../packages/ai/src/knowledge/ingest";
import { runJob } from "../../../../packages/ai/src/jobs/runner";
import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

function createEmbedFn(): EmbedFn {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = openai.embedding("text-embedding-3-small");
  return async (texts) => {
    if (texts.length === 0) return [];
    try {
      const { embeddings } = await embedMany({ model, values: texts });
      return embeddings;
    } catch (err) {
      console.warn("[ingest-knowledge] embedMany failed:", err);
      return texts.map(() => null);
    }
  };
}

export async function ingestKnowledgeJob(locale: "zh" | "en" = "zh") {
  const embedFn = createEmbedFn();
  // Run the actual embedding ingestion pipeline (both locales)
  const [zhResult, enResult] = await Promise.allSettled([
    ingestAllKnowledge("zh", embedFn),
    ingestAllKnowledge("en", embedFn),
  ]);

  const zhChunks = zhResult.status === "fulfilled" ? zhResult.value.chunksUpserted : 0;
  const enChunks = enResult.status === "fulfilled" ? enResult.value.chunksUpserted : 0;
  const errors = [
    ...(zhResult.status === "rejected" ? [String(zhResult.reason)] : []),
    ...(enResult.status === "rejected" ? [String(enResult.reason)] : []),
  ];

  if (errors.length > 0) {
    console.warn("[ingest-knowledge] partial errors:", errors);
  }

  console.log(
    `[ingest-knowledge] ingested zh=${zhChunks} en=${enChunks} chunks`,
  );

  // Return demo-format job result for the admin UI
  return runJob({ jobId: "ingest-knowledge", locale });
}
