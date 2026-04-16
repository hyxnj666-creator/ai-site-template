import {
  getHomeContent,
  getPersonalProfile,
  getSiteCopy,
  projects,
  timeline,
  type SiteLocale,
} from "@ai-site/content";
import { buildOpenSourceKnowledgeDocuments } from "@ai-site/ai/src/sources/open-source-profile";
import { isPgvectorEnabled, listSourceRecords, vectorSearchKnowledgeChunks } from "@ai-site/db";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { readFile } from "node:fs/promises";
import path from "node:path";

interface KnowledgeDocument {
  content: string;
  path: string;
  title: string;
}

export interface KnowledgeHit {
  path: string;
  score: number;
  snippet: string;
  title: string;
}

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

let markdownDocumentCache: Promise<KnowledgeDocument[]> | null = null;

/**
 * Retrieve the most relevant knowledge chunks for a given query.
 *
 * Strategy (in priority order):
 *  1. If pgvector is enabled and knowledge_chunks table is populated → vector similarity search
 *  2. Fallback: TF-IDF keyword scoring over all source documents (always available)
 *
 * Both paths return the same KnowledgeHit[] shape so callers are unaffected.
 */
export async function retrieveKnowledge({
  limit = 4,
  locale,
  query,
}: {
  limit?: number;
  locale: SiteLocale;
  query: string;
}): Promise<KnowledgeHit[]> {
  // Attempt vector search when pgvector is ready
  if (isPgvectorEnabled()) {
    try {
      const vectorHits = await vectorRetrieve({ limit, locale, query });
      if (vectorHits.length > 0) return vectorHits;
      // Vector index empty — fall through to TF-IDF
    } catch {
      // Vector search failed — fall through to TF-IDF
    }
  }

  return tfidfRetrieve({ limit, locale, query });
}

// ─── Vector retrieval ─────────────────────────────────────────────────────────

async function vectorRetrieve({
  limit,
  locale,
  query,
}: {
  limit: number;
  locale: SiteLocale;
  query: string;
}): Promise<KnowledgeHit[]> {
  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: query });
  const results = await vectorSearchKnowledgeChunks({ embedding, limit, locale });

  return results.map(({ content, score, source_key, title }) => ({
    path: source_key,
    score: Math.round(score * 100) / 100,
    snippet: createSnippet(content),
    title,
  }));
}

// ─── TF-IDF fallback ──────────────────────────────────────────────────────────

async function tfidfRetrieve({
  limit,
  locale,
  query,
}: {
  limit: number;
  locale: SiteLocale;
  query: string;
}): Promise<KnowledgeHit[]> {
  const staticDocuments = buildStaticDocuments(locale);
  const [markdownDocuments, sourceDocuments, openSourceDocuments] = await Promise.all([
    getMarkdownDocuments(),
    getSourceRecordDocuments(),
    buildOpenSourceKnowledgeDocuments(),
  ]);
  const documents = [
    ...staticDocuments,
    ...markdownDocuments,
    ...openSourceDocuments,
    ...sourceDocuments,
  ];
  const terms = extractQueryTerms(query);

  const ranked = documents
    .map((document) => ({
      document,
      score: scoreDocument(document, terms),
    }))
    .sort((left, right) => right.score - left.score);

  const positiveHits = ranked.filter((entry) => entry.score > 0).slice(0, limit);
  const fallbackHits =
    positiveHits.length > 0 ? positiveHits : ranked.slice(0, limit);

  return fallbackHits.map(({ document, score }) => ({
    path: document.path,
    score,
    snippet: createSnippet(document.content),
    title: document.title,
  }));
}

function buildStaticDocuments(locale: SiteLocale): KnowledgeDocument[] {
  const profile = getPersonalProfile(locale);
  const home = getHomeContent(locale);
  const siteCopy = getSiteCopy(locale);

  return [
    {
      content: [profile.name, profile.title, profile.summary].join("\n"),
      path: "packages/content/src/personal.ts",
      title: locale === "zh" ? "个人简介" : "Personal profile",
    },
    {
      content: [
        home.hero.title,
        home.hero.description,
        home.capabilities.title,
        home.capabilities.description,
        home.capabilities.primaryCard.title,
        home.capabilities.primaryCard.description,
        home.capabilities.primaryCard.bullets.join("\n"),
        home.capabilities.utilityCards.map((c) => `${c.title}: ${c.description}`).join("\n"),
      ].join("\n"),
      path: "packages/content/src/home.ts",
      title: locale === "zh" ? "首页内容与能力矩阵" : "Homepage content and capabilities",
    },
    {
      content: projects
        .map(
          (project) =>
            `${project.title}\n${project.summary}\n${project.tags.join(", ")}`,
        )
        .join("\n\n"),
      path: "packages/content/src/projects.ts",
      title: locale === "zh" ? "项目列表" : "Projects list",
    },
    {
      content: timeline
        .map(
          (item) => `${item.year}\n${item.title}\n${item.description}`,
        )
        .join("\n\n"),
      path: "packages/content/src/timeline.ts",
      title: locale === "zh" ? "技术时间线" : "Timeline",
    },
    {
      content: [
        siteCopy.pages.ai.title,
        siteCopy.pages.ai.description,
        siteCopy.pages.aiChat.title,
        siteCopy.pages.aiChat.description,
        siteCopy.pages.aiKnowledge.title,
        siteCopy.pages.aiKnowledge.description,
      ].join("\n"),
      path: "packages/content/src/site-copy.ts",
      title: locale === "zh" ? "页面文案与站点结构" : "Site pages and copy",
    },
  ];
}

async function getMarkdownDocuments() {
  if (!markdownDocumentCache) {
    markdownDocumentCache = buildMarkdownDocuments();
  }

  return markdownDocumentCache;
}

async function buildMarkdownDocuments(): Promise<KnowledgeDocument[]> {
  const designPath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "..",
    "..",
    "DESIGN.md",
  );
  const memoryPath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "..",
    "..",
    "MEMORY.md",
  );

  const [designContent, memoryContent] = await Promise.all([
    readFile(designPath, "utf8"),
    readFile(memoryPath, "utf8"),
  ]);

  return [
    ...splitMarkdownIntoDocuments(
      designContent,
      "DESIGN.md",
      "Technical design",
    ),
    ...splitMarkdownIntoDocuments(
      memoryContent,
      "MEMORY.md",
      "Development memory",
    ),
  ];
}

async function getSourceRecordDocuments(): Promise<KnowledgeDocument[]> {
  const [blogRecords, githubRecords] = await Promise.all([
    listSourceRecords({ limit: 64, sourceType: "blog" }),
    listSourceRecords({ limit: 20, sourceType: "github" }),
  ]);

  return [
    ...blogRecords.map((record) => ({
      content: record.content,
      path: record.pathOrUrl,
      title: record.title,
    })),
    ...githubRecords.map((record) => ({
      content: record.content,
      path: record.pathOrUrl,
      title: record.title,
    })),
  ];
}

function splitMarkdownIntoDocuments(
  markdown: string,
  filePath: string,
  fallbackTitle: string,
) {
  const lines = markdown.split(/\r?\n/);
  const documents: KnowledgeDocument[] = [];
  let currentTitle = fallbackTitle;
  let currentLines: string[] = [];

  function pushCurrent() {
    const content = currentLines.join("\n").trim();

    if (!content) {
      return;
    }

    documents.push({
      content,
      path: filePath,
      title: currentTitle,
    });
  }

  for (const line of lines) {
    if (/^##+\s+/.test(line)) {
      pushCurrent();
      currentTitle = line.replace(/^##+\s+/, "").trim();
      currentLines = [line];
      continue;
    }

    currentLines.push(line);
  }

  pushCurrent();

  return documents;
}

function extractQueryTerms(query: string) {
  const normalized = normalizeText(query);
  const latinTerms = normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1);
  const cjkTerms = normalized.match(/[\p{Script=Han}]{2,}/gu) ?? [];
  const combined = [...latinTerms, ...cjkTerms];

  if (normalized.length <= 64) {
    combined.push(normalized);
  }

  return [...new Set(combined)].slice(0, 10);
}

function scoreDocument(document: KnowledgeDocument, terms: string[]) {
  if (terms.length === 0) {
    return 0;
  }

  const title = normalizeText(document.title);
  const content = normalizeText(document.content);

  return terms.reduce((score, term) => {
    if (!term) {
      return score;
    }

    let nextScore = score;

    if (title.includes(term)) {
      nextScore += 6;
    }

    if (content.includes(term)) {
      nextScore += 3;
      const matches = content.split(term).length - 1;
      nextScore += Math.min(matches, 3);
    }

    return nextScore;
  }, 0);
}

function createSnippet(input: string, maxLength = 420) {
  const compact = input.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength).trim()}...`;
}

function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}
