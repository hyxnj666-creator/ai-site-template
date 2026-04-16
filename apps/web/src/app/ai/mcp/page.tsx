import type { Metadata } from "next";
import { McpInterfacePage } from "@/components/platform-pages/mcp-interface-page";

export const metadata: Metadata = {
  title: "MCP Interface",
  description: "Model Context Protocol 演示 — 展示 AI 模型如何通过工具调用连接外部系统。",
};

export default function Page() {
  return <McpInterfacePage />;
}

