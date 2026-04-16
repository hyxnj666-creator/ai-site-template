import type { Metadata } from "next";
import { KnowledgeBasePage } from "@/components/ai-pages/knowledge-base-page";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "RAG 知识检索演示 — pgvector 向量搜索、TF-IDF 混合检索、四阶段流程可视化。",
};

export default function Page() {
  return <KnowledgeBasePage />;
}

