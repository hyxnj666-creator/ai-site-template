import type { Metadata } from "next";
import { EvolutionLogPage } from "@/components/platform-pages/evolution-log-page";

export const metadata: Metadata = {
  title: "Evolution Log",
  description:
    "技术进化时间轴 — 从前端到 AI 全栈的成长脉络，15+ 核心技能可视化。",
};

export default function Page() {
  return <EvolutionLogPage />;
}

