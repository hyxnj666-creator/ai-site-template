import type { Metadata } from "next";
import { ExperimentLabPage } from "@/components/platform-pages/experiment-lab-pages";

export const metadata: Metadata = {
  title: "Experiment Lab",
  description: "前沿技术实验室 — Generative UI、WebGPU、Voice Agent 等实验性项目探索。",
};

export default function Page() {
  return <ExperimentLabPage />;
}

