"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { siteCopyByLocale } from "@ai-site/content";
import { PageIntro } from "@ai-site/ui";
import { useLocalizedValue } from "@/components/locale-provider";
import { logoutAction } from "./login/actions";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const copy = useLocalizedValue(siteCopyByLocale);
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-outline-variant/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <PageIntro
            description={copy.adminLayout.description}
            eyebrow={copy.adminLayout.eyebrow}
            title={copy.adminLayout.title}
            variant="inline"
          />
          <form action={logoutAction}>
            <button
              className="rounded-xl border border-outline-variant/30 bg-surface-high/40 px-4 py-2 font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:border-red-400/30 hover:text-red-400"
              type="submit"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
