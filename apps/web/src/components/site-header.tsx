"use client";

import Link from "next/link";
import { type LocalizedValue, siteCopyByLocale, siteLinks } from "@ai-site/content";
import { usePathname } from "next/navigation";
import { GlassPanel, GlowButton, StatusChip, buttonClassName } from "@ai-site/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCommandPalette } from "./command-palette-provider";
import { LocaleSwitcher } from "./locale-switcher";
import { useLocalizedValue } from "./locale-provider";
import { ThemeToggle } from "./theme-toggle";
import { useSoundEnabled, useToggleSound, useSoundOnNavigate } from "@/hooks/use-sound";
import { Volume2, VolumeX, Menu, X, Sparkles } from "lucide-react";

function SoundToggle() {
  const enabled = useSoundEnabled();
  const toggle = useToggleSound();
  return (
    <button
      aria-label={enabled ? "Mute sounds" : "Enable sounds"}
      className={buttonClassName({
        className: "min-h-11 min-w-11 px-3 text-xs uppercase tracking-[0.16em]",
        size: "md",
        variant: "ghost",
      })}
      onClick={toggle}
      type="button"
    >
      {enabled ? (
        <Volume2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
      ) : (
        <VolumeX aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
    </button>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  const Icon = open ? X : Menu;
  return (
    <Icon
      aria-hidden="true"
      className="h-5 w-5 text-foreground-muted transition-transform duration-200"
      strokeWidth={1.5}
    />
  );
}

function MobileDrawer({
  items,
  open,
  onClose,
  pathname,
  footer,
}: {
  items: Array<{ href: string; label: string }>;
  open: boolean;
  onClose: () => void;
  pathname: string;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { onClose(); }, [pathname]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <nav className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-background/95 backdrop-blur-xl border-l border-outline-variant/20 animate-[slide-in-right_0.25s_ease]">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <span className="font-label-ui text-[10px] uppercase tracking-[0.3em] text-foreground-muted">
            Menu
          </span>
          <button
            className="flex items-center justify-center rounded-lg min-h-11 min-w-11 text-foreground-muted hover:text-foreground transition-colors"
            onClick={onClose}
            type="button"
            aria-label="Close menu"
          >
            <HamburgerIcon open />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                className={[
                  "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-muted hover:bg-surface-high/40 hover:text-foreground",
                ].join(" ")}
                href={item.href}
                onClick={onClose}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        {footer && (
          <div className="border-t border-outline-variant/20 px-5 py-4 space-y-3">
            {footer}
          </div>
        )}
      </nav>
    </>
  );
}

const chatHeaderCopyByLocale: LocalizedValue<{
  brand: string;
  nav: Array<{ href: string; label: string }>;
}> = {
  zh: {
    brand: "AI_SITE",
    nav: [
      { href: "/ai", label: "Nexus" },
      { href: "/ai/knowledge", label: "Memories" },
      { href: "/ai/mcp", label: "Protocol" },
      { href: "/ai/chat", label: "Chat" },
      { href: "/ai/workflow", label: "Workflow" },
      { href: "/ai/arena", label: "Arena" },
      { href: "/ai/os", label: "OS" },
      { href: "/terminal", label: "Terminal" },
    ],
  },
  en: {
    brand: "AI_SITE",
    nav: [
      { href: "/ai", label: "Nexus" },
      { href: "/ai/knowledge", label: "Memories" },
      { href: "/ai/mcp", label: "Protocol" },
      { href: "/ai/chat", label: "Chat" },
      { href: "/ai/workflow", label: "Workflow" },
      { href: "/ai/arena", label: "Arena" },
      { href: "/ai/os", label: "OS" },
      { href: "/terminal", label: "Terminal" },
    ],
  },
};

function NeuralBrandIcon() {
  return <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.5} />;
}

// ─── Debug Chip (Easter Egg #2) ───────────────────────────────────────────────

function DebugChip({ pathname, onDismiss }: { pathname: string; onDismiss: () => void }) {
  const locale = typeof document !== "undefined"
    ? (document.documentElement.getAttribute("data-locale") ?? "en")
    : "en";

  return (
    <div className="fixed bottom-6 left-6 z-[9998] animate-[slide-up_0.3s_ease]">
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/90 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px]">
        <div className="mb-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-yellow-400/70">debug mode</span>
          </div>
          <button
            className="font-mono text-[10px] text-white/20 hover:text-white/60"
            onClick={onDismiss}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex items-center gap-3">
            <span className="w-16 text-white/30">route</span>
            <span className="text-yellow-300/80">{pathname}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-white/30">locale</span>
            <span className="text-yellow-300/80">{locale}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-white/30">build</span>
            <span className="text-yellow-300/80">v2.0.26</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-white/30">runtime</span>
            <span className="text-yellow-300/80">next.js edge</span>
          </div>
          <div className="mt-2 border-t border-white/5 pt-2 text-[10px] text-white/20">
            {locale === "zh" ? "你发现了第 2 个彩蛋 🥚" : "You found Easter egg #2 🥚"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const copy = useLocalizedValue(siteCopyByLocale);
  const chatCopy = useLocalizedValue(chatHeaderCopyByLocale);
  const { openPalette } = useCommandPalette();
  const pathname = usePathname();

  // Logo click counter for Easter Egg #2
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debugVisible, setDebugVisible] = useState(false);

  const handleLogoClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      setDebugVisible(true);
    } else {
      clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 1500);
    }
  }, []);

  useEffect(() => () => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  useSoundOnNavigate(pathname);
  const isImmersiveRoute =
    pathname === "/ai/chat" || pathname === "/ai/workflow" || pathname === "/ai/arena";
  const isTerminalRoute = pathname === "/terminal";

  if (isTerminalRoute) return null;

  if (isImmersiveRoute) {
    return (
      <>
        {debugVisible && <DebugChip onDismiss={() => setDebugVisible(false)} pathname={pathname} />}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/20 bg-background/70 backdrop-blur-[24px]">
          <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <NeuralBrandIcon />
              <button
                className="font-display-ui cursor-pointer select-none text-lg font-semibold tracking-[-0.05em] text-primary"
                onClick={handleLogoClick}
                type="button"
              >
                {chatCopy.brand}
              </button>
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              {chatCopy.nav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    className={[
                      "font-display-ui text-xs font-semibold uppercase tracking-[-0.02em] transition-colors duration-300",
                      isActive ? "text-primary" : "text-foreground-muted hover:text-foreground",
                    ].join(" ")}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                className="hidden rounded-full border border-outline-variant/30 bg-surface-low/50 px-3 py-2 font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:text-foreground lg:inline-flex"
                onClick={openPalette}
                type="button"
              >
                Ctrl K
              </button>
              <SoundToggle />
              <LocaleSwitcher />
              <ThemeToggle />
              <Link
                className="hidden rounded-full border border-outline-variant/30 bg-surface-low/50 px-3 py-2 font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:text-foreground md:inline-flex"
                href={siteLinks.github}
                rel="noreferrer"
                target="_blank"
              >
                {copy.shell.githubLabel}
              </Link>
              <button
                className="flex items-center justify-center rounded-lg min-h-11 min-w-11 text-foreground-muted hover:text-foreground md:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
                aria-label="Open menu"
              >
                <HamburgerIcon open={false} />
              </button>
            </div>
          </div>
        </header>
        <MobileDrawer
          items={chatCopy.nav}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          pathname={pathname}
          footer={
            <>
              <button
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-low/50 px-4 py-3 font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:text-foreground"
                onClick={() => { setMobileOpen(false); openPalette(); }}
                type="button"
              >
                ⌘K Command Palette
              </button>
              <Link
                className="block text-center rounded-xl border border-outline-variant/20 bg-surface-low/50 px-4 py-3 font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:text-foreground"
                href={siteLinks.github}
                rel="noreferrer"
                target="_blank"
              >
                {copy.shell.githubLabel}
              </Link>
            </>
          }
        />
      </>
    );
  }

  return (
    <>
      {debugVisible && <DebugChip onDismiss={() => setDebugVisible(false)} pathname={pathname} />}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
        <GlassPanel className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 rounded-[24px] px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <button
              className="font-display-ui cursor-pointer select-none text-xl font-semibold tracking-[-0.05em] text-primary"
              onClick={handleLogoClick}
              type="button"
            >
              AI Site
            </button>
            <div className="hidden lg:block">
              <StatusChip pulse={false} tone="secondary">
                {copy.shell.status}
              </StatusChip>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {copy.shell.navigation.map((item) => (
              <Link
                key={item.href}
                className="text-sm text-foreground-muted transition-colors duration-300 hover:text-foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <GlowButton
              className="hidden min-h-10 px-3 text-[11px] uppercase tracking-[0.18em] lg:inline-flex"
              size="md"
              variant="ghost"
              onClick={openPalette}
            >
              <span>Ctrl</span>
              <span className="rounded-md border border-outline-variant/30 px-1.5 py-0.5">
                K
              </span>
            </GlowButton>
            <SoundToggle />
            <LocaleSwitcher />
            <ThemeToggle />
            <Link
              className={buttonClassName({
                className: "hidden md:inline-flex",
                size: "md",
                variant: "secondary",
              })}
              href={siteLinks.github}
              rel="noreferrer"
              target="_blank"
            >
              {copy.shell.githubLabel}
            </Link>
            <Link
              className={buttonClassName({ size: "md", className: "hidden sm:inline-flex" })}
              href="/ai/chat"
            >
              {copy.shell.initializeAi}
            </Link>
            <button
              className="flex items-center justify-center rounded-lg min-h-11 min-w-11 text-foreground-muted hover:text-foreground md:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <HamburgerIcon open={false} />
            </button>
          </div>
        </GlassPanel>
      </header>
      <MobileDrawer
        items={[
          ...copy.shell.navigation,
          { href: "/ai/chat", label: copy.shell.initializeAi },
        ]}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
        footer={
          <>
            <button
              className="w-full rounded-xl border border-outline-variant/20 bg-surface-low/50 px-4 py-3 font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:text-foreground"
              onClick={() => { setMobileOpen(false); openPalette(); }}
              type="button"
            >
              ⌘K Command Palette
            </button>
            <Link
              className="block text-center rounded-xl border border-outline-variant/20 bg-surface-low/50 px-4 py-3 font-label-ui text-[11px] uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:text-foreground"
              href={siteLinks.github}
              rel="noreferrer"
              target="_blank"
            >
              {copy.shell.githubLabel}
            </Link>
          </>
        }
      />
    </>
  );
}
