import { AgentOsConsole } from "@/components/ai-pages/agent-os/agent-os-console";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Real-time console for the AI OS runtime — monitor sessions, runs, tool calls, knowledge retrieval, and policy enforcement.",
  title: "Agent OS Console | AI Site",
};

export default function Page() {
  return <AgentOsConsole />;
}
