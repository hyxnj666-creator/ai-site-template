/**
 * POST /api/knowledge/ingest
 *
 * Triggers the full knowledge ingestion pipeline:
 *   static content + source records → chunk → embed → upsert to pgvector
 *
 * Protected by ADMIN_SECRET header (must match ADMIN_SECRET env var).
 * When DATABASE_URL is not configured the endpoint is still usable but
 * pgvector won't be populated (TF-IDF fallback remains active).
 */
import { ingestAllKnowledge, getKnowledgeIndexStats, type EmbedFn } from "@ai-site/ai/src/knowledge/ingest";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { NextResponse } from "next/server";

function createEmbedFn(): EmbedFn {
  const model = openai.embedding("text-embedding-3-small");
  return async (texts) => {
    if (texts.length === 0) return [];
    try {
      const { embeddings } = await embedMany({ model, values: texts });
      return embeddings;
    } catch (err) {
      console.warn("[ingest] embedMany failed:", err);
      return texts.map(() => null);
    }
  };
}

function isAuthorized(request: Request) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-admin-secret") ?? "";
  if (header.length !== secret.length) return false;
  let mismatch = 0;
  for (let i = 0; i < secret.length; i++) {
    mismatch |= header.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function GET() {
  const stats = await getKnowledgeIndexStats();
  return NextResponse.json({ stats, status: "ready" });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { locale?: unknown }
    | null;

  const localeRaw = body?.locale;
  const locales: Array<"zh" | "en"> =
    localeRaw === "zh" ? ["zh"] : localeRaw === "en" ? ["en"] : ["zh", "en"];

  const startMs = Date.now();
  const embedFn = createEmbedFn();
  const results = await Promise.allSettled(
    locales.map((locale) => ingestAllKnowledge(locale, embedFn)),
  );

  const report = results.map((result, i) => {
    const locale = locales[i]!;
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      chunksUpserted: 0,
      durationMs: 0,
      errors: [String(result.reason)],
      locale,
      sourcesProcessed: 0,
    };
  });

  const totalChunks = report.reduce((sum, r) => sum + r.chunksUpserted, 0);
  const stats = await getKnowledgeIndexStats();

  return NextResponse.json({
    durationMs: Date.now() - startMs,
    locales,
    report,
    stats,
    status: "ok",
    totalChunks,
  });
}
