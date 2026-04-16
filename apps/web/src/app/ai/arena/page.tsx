import type { Metadata } from "next";
import { ModelArenaPage } from "@/components/ai-pages/model-arena-page";

export const metadata: Metadata = {
  title: "Model Arena",
  description: "GPT vs Claude 双模型并行竞技场 — 实时 streaming 对比、投票系统、Hall of Fame。",
};

export default function Page() {
  return <ModelArenaPage />;
}

