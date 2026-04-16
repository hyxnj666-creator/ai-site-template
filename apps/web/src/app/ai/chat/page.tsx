import type { Metadata } from "next";
import { ChatPage } from "@/components/chat/chat-page";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "与 AI 助手实时对话 — 真实 token streaming、Markdown 渲染、代码高亮。",
};

export default function Page() {
  return <ChatPage />;
}

