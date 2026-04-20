import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  accentGlowClassNames,
  accentTextClassNames,
  type AccentTone,
} from "../tokens/accents";

interface PortalCardProps extends ComponentPropsWithoutRef<"a"> {
  accent?: AccentTone;
  cta: string;
  description: string;
  eyebrow: string;
  title: string;
  visual?: ReactNode;
}

export function PortalCard({
  accent = "primary",
  className = "",
  cta,
  description,
  eyebrow,
  title,
  visual,
  ...props
}: PortalCardProps) {
  return (
    <div
      className={[
        "group relative isolate block overflow-hidden rounded-[32px] border border-white/[0.08] bg-white/[0.03] px-8 py-10 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05]",
        className,
      ].join(" ")}
    >
      <a className="absolute inset-0 z-0" {...props}>
        <span className="sr-only">{title}</span>
      </a>
      <div
        className={[
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-linear-to-br",
          accentGlowClassNames[accent],
        ].join(" ")}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-surface-bright/20 blur-3xl" />
      {visual ? <div className="pointer-events-none absolute inset-0">{visual}</div> : null}

      <div className="pointer-events-none relative z-10 flex min-h-[320px] flex-col justify-between">
        <div>
          <p
            className={[
              "font-label-ui text-xs uppercase tracking-[0.24em]",
              accentTextClassNames[accent],
            ].join(" ")}
          >
            {eyebrow}
          </p>
          <h3 className="font-display-ui mt-5 text-4xl font-semibold tracking-[-0.05em]">
            {title}
          </h3>
          <p className="mt-4 text-sm leading-7 text-foreground-muted">
            {description}
          </p>
        </div>

        <div
          className={[
            "inline-flex items-center gap-3 text-sm uppercase tracking-[0.18em] transition-colors",
            accentTextClassNames[accent],
          ].join(" ")}
        >
          <span>{cta}</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </div>
  );
}
