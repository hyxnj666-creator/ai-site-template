"use client";

import type { ReactNode } from "react";
import { siteCopyByLocale } from "@ai-site/content";
import { PageIntro } from "@ai-site/ui";
import { useLocalizedValue } from "@/components/locale-provider";
import { usePathname } from "next/navigation";

export default function AiLayout({ children }: { children: ReactNode }) {
  const copy = useLocalizedValue(siteCopyByLocale);
  const pathname = usePathname();

  if (pathname === "/ai/chat" || pathname === "/ai/workflow" || pathname === "/ai/arena") {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-outline-variant/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-6 py-5 md:px-10">
          <PageIntro
            description={copy.aiLayout.description}
            eyebrow={copy.aiLayout.eyebrow}
            title={copy.aiLayout.title}
            variant="inline"
          />
        </div>
      </div>
      {children}
    </div>
  );
}
