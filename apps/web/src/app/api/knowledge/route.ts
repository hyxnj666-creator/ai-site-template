import { buildOpenSourceAccountProfile } from "@ai-site/ai/src/sources/open-source-profile";
import { getKnowledgeIndexStats } from "@ai-site/ai/src/knowledge/ingest";
import { countSourceRecords, isPgvectorEnabled } from "@ai-site/db";
import { NextResponse } from "next/server";
import { retrieveKnowledge } from "@/lib/chat/knowledge";
import { checkRateLimit } from "@/lib/rate-limit";

function parseLocale(value: unknown): "zh" | "en" {
  return value === "en" ? "en" : "zh";
}

function parseLimit(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return 4;
  }

  return Math.min(Math.max(parsed, 1), 8);
}

function parseQuery(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const [githubSourceCount, blogSourceCount, profile, vectorStats] = await Promise.all([
    countSourceRecords({ sourceType: "github" }),
    countSourceRecords({ sourceType: "blog" }),
    buildOpenSourceAccountProfile(),
    getKnowledgeIndexStats(),
  ]);

  return NextResponse.json({
    index: {
      blogSourceCount,
      flagshipRepos: profile.flagshipRepos.slice(0, 3).map((repo) => ({
        linkedPosts: repo.linkedPosts.slice(0, 2).map((post) => post.title),
        packageName: repo.packageName,
        repoName: repo.repoName,
      })),
      githubSourceCount,
      sourceKey: profile.sourceKey,
      totalStars: profile.totalStars,
    },
    retrieval: {
      mode: isPgvectorEnabled() ? "vector" : "tfidf",
      vectorChunks: vectorStats,
    },
    status: "ready",
  });
}

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, "knowledge", { windowMs: 60_000, maxRequests: 30 });
  if (rateLimited) return rateLimited;

  const payload = (await request.json().catch(() => null)) as
    | {
        limit?: unknown;
        locale?: unknown;
        query?: unknown;
      }
    | null;
  const query = parseQuery(payload?.query);

  if (!query) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "A non-empty query string is required.",
      },
      { status: 400 },
    );
  }

  const locale = parseLocale(payload?.locale);
  const limit = parseLimit(payload?.limit);
  const [hits, profile] = await Promise.all([
    retrieveKnowledge({
      limit,
      locale,
      query,
    }),
    buildOpenSourceAccountProfile(),
  ]);

  return NextResponse.json({
    hits,
    locale,
    openSourceContext: {
      flagshipRepos: profile.flagshipRepos.slice(0, 3).map((repo) => ({
        packageName: repo.packageName,
        repoName: repo.repoName,
      })),
      sourceKey: profile.sourceKey,
    },
    query,
    status: "ok",
  });
}

