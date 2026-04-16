import type { Metadata } from "next";
import { AiPlaygroundPage } from "@/components/platform-pages/ai-playground-page";

export const metadata: Metadata = {
  title: "AI Nexus",
  description:
    "AI 能力中枢 — Agent、Chat、Workflow、Arena、Knowledge、MCP 六大模块，展示完整 AI 工程栈。",
};

export default function Page() {
  return <AiPlaygroundPage />;
}

