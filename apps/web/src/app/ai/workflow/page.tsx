import type { Metadata } from "next";
import { SentientFlowPage } from "@/components/ai-pages/sentient-flow-page";

export const metadata: Metadata = {
  title: "Workflow Studio",
  description: "可视化 AI 工作流编辑器 — React Flow 拖拽编排、NDJSON 流式执行、实时节点状态。",
};

export default function Page() {
  return <SentientFlowPage />;
}

