"use client";

import { siteCopyByLocale } from "@ai-site/content";
import { useTheme } from "next-themes";
import { buttonClassName } from "@ai-site/ui";
import { useLocalizedValue, useSiteLocale } from "./locale-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { locale } = useSiteLocale();
  const copy = useLocalizedValue(siteCopyByLocale);
  const nextTheme = resolvedTheme === "light" ? "dark" : "light";

  return (
    <button
      aria-label={
        locale === "zh"
          ? `切换到${nextTheme === "dark" ? "深色" : "浅色"}主题`
          : `Switch to ${nextTheme} mode`
      }
      className={buttonClassName({
        className: "min-h-10 px-3 text-xs uppercase tracking-[0.16em]",
        size: "md",
        variant: "ghost",
      })}
      onClick={() => setTheme(nextTheme)}
      type="button"
    >
      <span className="h-2 w-2 rounded-full bg-primary" />
      <span>{copy.shell.themeLabel}</span>
    </button>
  );
}
