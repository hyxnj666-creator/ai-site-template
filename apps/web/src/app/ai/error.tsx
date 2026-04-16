"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AiRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AiRouteError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-label-ui text-[10px] uppercase tracking-[0.3em] text-red-400/60">Module Error</p>
      <h2 className="font-display-ui mt-4 text-3xl font-semibold tracking-[-0.05em]">This AI module crashed</h2>
      <p className="mt-4 max-w-sm text-sm leading-7 text-foreground-muted">
        {error.message || "An unexpected error occurred in this AI surface."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-label-ui text-[11px] uppercase tracking-[0.15em] text-primary transition-colors hover:bg-primary/20"
          onClick={reset}
          type="button"
        >
          Retry
        </button>
        <Link
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-label-ui text-[11px] uppercase tracking-[0.15em] text-foreground-muted transition-colors hover:bg-white/10"
          href="/ai"
        >
          Back to AI Hub
        </Link>
      </div>
    </div>
  );
}
