import type { Metadata } from "next";
import { AgentMissionControlPage } from "@/components/ai-pages/agent-mission-control-page";

export const metadata: Metadata = {
  title: "Agent Mission Control",
  description: "AI Agent 任务控制台 — 三阶段流式执行（Plan → Execute → Reflect），实时可视化。",
};

export default function Page() {
  return <AgentMissionControlPage />;
}

