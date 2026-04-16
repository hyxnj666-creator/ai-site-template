"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LocalizedValue, siteCopyByLocale } from "@ai-site/content";
import { useLocalizedValue } from "./locale-provider";

const footerExtraByLocale: LocalizedValue<{
  internalLinks: Array<{ href: string; label: string }>;
  copyright: string;
}> = {
  zh: {
    internalLinks: [
      { href: "/", label: "首页" },
      { href: "/about", label: "关于" },
      { href: "/evolution", label: "进化日志" },
      { href: "/ai", label: "AI Nexus" },
      { href: "/lab", label: "Lab" },
    ],
    copyright: `© ${new Date().getFullYear()} AI Site. All rights reserved.`,
  },
  en: {
    internalLinks: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/evolution", label: "Evolution" },
      { href: "/ai", label: "AI Nexus" },
      { href: "/lab", label: "Lab" },
    ],
    copyright: `© ${new Date().getFullYear()} AI Site. All rights reserved.`,
  },
};

export function SiteFooter() {
  const copy = useLocalizedValue(siteCopyByLocale);
  const extra = useLocalizedValue(footerExtraByLocale);
  const pathname = usePathname();

  if (pathname === "/ai/chat" || pathname === "/ai/workflow" || pathname === "/terminal") {
    return null;
  }

  return (
    <footer className="border-t border-outline-variant/20 bg-surface-lowest">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display-ui text-lg font-semibold tracking-[-0.04em] text-primary">
              {copy.footer.brand}
            </p>
            <p className="mt-2 font-label-ui text-[11px] uppercase tracking-[0.24em] text-foreground-muted">
              {copy.footer.tagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div className="flex flex-col gap-1">
              {extra.internalLinks.map((item) => (
                <Link
                  key={item.href}
                  className="py-1.5 font-label-ui text-[11px] uppercase tracking-[0.24em] text-foreground-muted transition-colors duration-300 hover:text-primary"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {copy.footer.links.map((item) => (
                <a
                  key={item.label}
                  className="py-1.5 font-label-ui text-[11px] uppercase tracking-[0.24em] text-foreground-muted transition-colors duration-300 hover:text-primary"
                  href={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-outline-variant/10 pt-6">
          <p className="font-label-ui text-[10px] uppercase tracking-[0.24em] text-foreground-muted/50">
            {extra.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
