import type { Metadata } from "next";
import { HomePage } from "@/components/home/homepage";

export const metadata: Metadata = {
  title: "AI Site | Living Interface",
  description:
    "AI 原生个人平台 — 融合 Agent、RAG、Workflow、MCP 等前沿 AI 能力的沉浸式交互体验。",
};

export default function Page() {
  return <HomePage />;
}
