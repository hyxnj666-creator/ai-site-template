"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type LineType = "input" | "output" | "error" | "ai" | "system" | "blank";

interface TerminalLine {
  content: string;
  id: string;
  streaming?: boolean;
  type: LineType;
}

// ─── Built-in command responses ──────────────────────────────────────────────

const BOOT_LINES = [
  { type: "system" as LineType, content: "  █████╗ ██╗    ███████╗██╗████████╗███████╗" },
  { type: "system" as LineType, content: " ██╔══██╗██║    ██╔════╝██║╚══██╔══╝██╔════╝" },
  { type: "system" as LineType, content: " ███████║██║    ███████╗██║   ██║   █████╗  " },
  { type: "system" as LineType, content: " ██╔══██║██║    ╚════██║██║   ██║   ██╔══╝  " },
  { type: "system" as LineType, content: " ██║  ██║██║    ███████║██║   ██║   ███████╗" },
  { type: "system" as LineType, content: " ╚═╝  ╚═╝╚═╝    ╚══════╝╚═╝   ╚═╝   ╚══════╝" },
  { type: "blank" as LineType, content: "" },
  { type: "system" as LineType, content: " AI_SITE OS v2.0.26 — AI-Native Personal Platform" },
  { type: "output" as LineType, content: " Copyright (c) 2026 AI Site · yoursite.example.com" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: " [boot]  Loading AI runtime...      ✓" },
  { type: "output" as LineType, content: " [boot]  Mounting knowledge base...  ✓" },
  { type: "output" as LineType, content: " [boot]  Connecting to OpenAI...     ✓" },
  { type: "output" as LineType, content: " [boot]  Initializing chat surface.. ✓" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: ' Type "help" for available commands. Tab to autocomplete.' },
  { type: "blank" as LineType, content: "" },
];

const HELP_TEXT = [
  { type: "system" as LineType, content: "AVAILABLE COMMANDS" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: "  about / whoami     — personal profile" },
  { type: "output" as LineType, content: "  projects / ls      — list projects" },
  { type: "output" as LineType, content: "  skills / stack     — tech stack overview" },
  { type: "output" as LineType, content: "  status             — current platform build status" },
  { type: "output" as LineType, content: "  contact / email    — contact information" },
  { type: "output" as LineType, content: "  goto <path>        — navigate to a page" },
  { type: "output" as LineType, content: "  clear / cls        — clear the terminal" },
  { type: "output" as LineType, content: "  <any text>         — ask AI anything" },
  { type: "blank" as LineType, content: "" },
];

const ABOUT_TEXT = [
  { type: "system" as LineType, content: "PROFILE: user-profile.json" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: '  name:       "Your Name"' },
  { type: "output" as LineType, content: '  title:      "AI Full-Stack Engineer"' },
  { type: "output" as LineType, content: '  location:   "Remote"' },
  { type: "output" as LineType, content: '  building:   "AI-native personal platform"' },
  { type: "output" as LineType, content: '  focus:      "Engineering · Design · AI Systems"' },
  { type: "output" as LineType, content: '  summary:    "Combining engineering foundations,' },
  { type: "output" as LineType, content: '               design taste, and AI capabilities."' },
  { type: "blank" as LineType, content: "" },
];

const PROJECTS_TEXT = [
  { type: "system" as LineType, content: "PROJECTS (/projects)" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: "  [1] ai-site          Next.js · AI SDK · React Flow" },
  { type: "output" as LineType, content: "      AI-native personal platform monorepo" },
  { type: "output" as LineType, content: "      Status: active · building in public" },
  { type: "blank" as LineType, content: "" },
  { type: "output" as LineType, content: '  Run "goto /ai" to explore AI modules.' },
  { type: "blank" as LineType, content: "" },
];

const SKILLS_TEXT = [
  { type: "system" as LineType, content: "TECH STACK" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: "  Frontend   Next.js · React · TypeScript · Tailwind" },
  { type: "output" as LineType, content: "  AI Layer   AI SDK (Vercel) · OpenAI · Anthropic" },
  { type: "output" as LineType, content: "  Canvas     React Flow · Framer Motion" },
  { type: "output" as LineType, content: "  Backend    Node.js · PostgreSQL · Redis" },
  { type: "output" as LineType, content: "  Tooling    pnpm workspaces · Zod · Shiki" },
  { type: "output" as LineType, content: "  DevOps     Docker · ECS · GitHub Actions" },
  { type: "blank" as LineType, content: "" },
];

const CONTACT_TEXT = [
  { type: "system" as LineType, content: "CONTACT" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: "  email:     you@yoursite.example.com" },
  { type: "output" as LineType, content: "  github:    github.com/your-github-username" },
  { type: "output" as LineType, content: "  site:      yoursite.example.com" },
  { type: "blank" as LineType, content: "" },
  { type: "output" as LineType, content: '  Tip: type "hire" in Cmd+K for a special surprise.' },
  { type: "blank" as LineType, content: "" },
];

const STATUS_TEXT = [
  { type: "system" as LineType, content: "PLATFORM STATUS" },
  { type: "system" as LineType, content: "─────────────────────────────────────────────────" },
  { type: "output" as LineType, content: "  [✓] Homepage          live" },
  { type: "output" as LineType, content: "  [✓] Chat              live · NDJSON streaming" },
  { type: "output" as LineType, content: "  [✓] Arena             live · GPT vs Claude" },
  { type: "output" as LineType, content: "  [✓] Workflow Studio   live · React Flow" },
  { type: "output" as LineType, content: "  [✓] Knowledge         live · retrieval demo" },
  { type: "output" as LineType, content: "  [✓] AI Artifacts      live · inline rendering" },
  { type: "output" as LineType, content: "  [✓] Terminal          live · you are here" },
  { type: "output" as LineType, content: "  [~] MCP Demo          building" },
  { type: "output" as LineType, content: "  [~] Multimodal        upcoming" },
  { type: "blank" as LineType, content: "" },
  { type: "output" as LineType, content: "  Phase: 3 / 5   Build: public" },
  { type: "blank" as LineType, content: "" },
];

const GOTO_ROUTES: Record<string, string> = {
  home: "/",
  "/": "/",
  ai: "/ai",
  "/ai": "/ai",
  chat: "/ai/chat",
  "/ai/chat": "/ai/chat",
  arena: "/ai/arena",
  "/ai/arena": "/ai/arena",
  workflow: "/ai/workflow",
  "/ai/workflow": "/ai/workflow",
  knowledge: "/ai/knowledge",
  "/ai/knowledge": "/ai/knowledge",
  terminal: "/terminal",
  "/terminal": "/terminal",
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeLines(defs: { type: LineType; content: string }[]): TerminalLine[] {
  return defs.map((d) => ({ ...d, id: createId() }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TerminalPage() {
  const router = useRouter();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [booted, setBooted] = useState(false);

  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Typewriter refs for AI output
  const twBufRef = useRef<string>("");
  const twIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mounted guard
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const prompt = "user@ai:~$";

  const appendLines = useCallback((newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [lines, scrollToBottom]);

  // Animated boot sequence
  useEffect(() => {
    if (booted) return;
    const bootLines = makeLines(BOOT_LINES);
    let i = 0;
    let cancelled = false;
    const getDelay = (idx: number) => idx < 6 ? 40 : idx < 8 ? 60 : 120;
    const showNext = () => {
      if (cancelled) return;
      if (i >= bootLines.length) { setBooted(true); return; }
      // Capture the value NOW before incrementing — callbacks close over the variable,
      // so we must snapshot it before i++ or React's deferred callback will read the wrong index.
      const line = bootLines[i];
      const delay = getDelay(i);
      i++;
      setLines((prev) => [...prev, line]);
      setTimeout(showNext, delay);
    };
    const t = setTimeout(showNext, 80);
    return () => { cancelled = true; clearTimeout(t); };
  }, [booted]);

  // Auto-focus input
  useEffect(() => {
    if (booted) inputRef.current?.focus();
  }, [booted]);

  // ESC to exit
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const stopStreaming = useCallback(() => {
    if (twIntervalRef.current) { clearInterval(twIntervalRef.current); twIntervalRef.current = null; }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    twBufRef.current = "";
  }, []);

  // ─── AI streaming ─────────────────────────────────────────────────────────

  const runAiQuery = useCallback(async (query: string) => {
    setIsPending(true);

    const aiLineId = createId();
    setLines((prev) => [
      ...prev,
      { content: "", id: aiLineId, streaming: true, type: "ai" },
    ]);

    twBufRef.current = "";

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Typewriter drain
    if (twIntervalRef.current) clearInterval(twIntervalRef.current);
    twIntervalRef.current = setInterval(() => {
      if (twBufRef.current.length === 0) return;
      const pending = twBufRef.current.length;
      const chars = pending > 150 ? 10 : pending > 50 ? 5 : 2;
      const released = twBufRef.current.slice(0, chars);
      twBufRef.current = twBufRef.current.slice(chars);
      setLines((prev) =>
        prev.map((l) =>
          l.id === aiLineId
            ? { ...l, content: l.content + released }
            : l,
        ),
      );
    }, 30);

    try {
      const locale = document.documentElement.getAttribute("data-locale") === "zh" ? "zh" : "en";

      const res = await fetch("/api/chat", {
        body: JSON.stringify({
          locale,
          messages: [{ content: query, role: "user" }],
          model: "gpt-5-mini",
          surface: "chat",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawBuf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        rawBuf += decoder.decode(value, { stream: true });
        const rawLines = rawBuf.split("\n");
        rawBuf = rawLines.pop() ?? "";
        for (const raw of rawLines) {
          const t = raw.trim();
          if (!t) continue;
          try {
            const ev = JSON.parse(t) as Record<string, unknown>;
            if (ev.type === "chunk") {
              const chunk = ev.content as string;
              fullText += chunk;
              twBufRef.current += chunk;
            }
          } catch { /* skip */ }
        }
      }

      // Drain buffer, then finalize
      const snapFinal = () => {
        if (twIntervalRef.current) { clearInterval(twIntervalRef.current); twIntervalRef.current = null; }
        setLines((prev) =>
          prev.map((l) =>
            l.id === aiLineId
              ? { ...l, content: fullText, streaming: false }
              : l,
          ),
        );
        setLines((prev) => [...prev, { content: "", id: createId(), type: "blank" }]);
      };

      const drainStart = Date.now();
      const drainCheck = setInterval(() => {
        if (twBufRef.current.length === 0 || Date.now() - drainStart > 2500) {
          clearInterval(drainCheck);
          if (mountedRef.current) snapFinal();
        }
      }, 40);
    } catch (err) {
      if (twIntervalRef.current) { clearInterval(twIntervalRef.current); twIntervalRef.current = null; }
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      if (!isAbort) {
        setLines((prev) => [
          ...prev.filter((l) => l.id !== aiLineId),
          { content: "[error] AI unavailable — check OpenAI configuration", id: createId(), type: "error" },
          { content: "", id: createId(), type: "blank" },
        ]);
      } else {
        setLines((prev) =>
          prev.map((l) => l.id === aiLineId ? { ...l, streaming: false } : l),
        );
        setLines((prev) => [...prev, { content: "", id: createId(), type: "blank" }]);
      }
    } finally {
      abortRef.current = null;
      setIsPending(false);
    }
  }, []);

  // ─── Command processing ───────────────────────────────────────────────────

  const processCommand = useCallback((raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    // Echo input
    appendLines([{ content: `${prompt} ${cmd}`, id: createId(), type: "input" }]);

    // History
    historyRef.current = [cmd, ...historyRef.current.slice(0, 49)];
    historyIdxRef.current = -1;

    const lower = cmd.toLowerCase();
    const parts = lower.split(/\s+/);
    const verb = parts[0];
    const args = parts.slice(1);

    if (verb === "clear" || verb === "cls") {
      setLines([]);
      return;
    }

    if (verb === "help" || verb === "?") {
      appendLines(makeLines(HELP_TEXT));
      return;
    }

    if (verb === "about" || verb === "whoami" || verb === "me") {
      appendLines(makeLines(ABOUT_TEXT));
      return;
    }

    if (verb === "projects" || verb === "ls") {
      appendLines(makeLines(PROJECTS_TEXT));
      return;
    }

    if (verb === "skills" || verb === "stack" || verb === "tech") {
      appendLines(makeLines(SKILLS_TEXT));
      return;
    }

    if (verb === "contact" || verb === "email") {
      appendLines(makeLines(CONTACT_TEXT));
      return;
    }

    if (verb === "status") {
      appendLines(makeLines(STATUS_TEXT));
      return;
    }

    if (verb === "goto" || verb === "cd" || verb === "nav") {
      const target = args[0] ?? "";
      const route = GOTO_ROUTES[target];
      if (route) {
        appendLines(makeLines([
          { type: "output", content: `Navigating to ${route}...` },
          { type: "blank", content: "" },
        ]));
        setTimeout(() => router.push(route), 600);
      } else {
        appendLines(makeLines([
          { type: "error", content: `Unknown route: "${target}"` },
          { type: "output", content: "  Available: home, ai, chat, arena, workflow, knowledge" },
          { type: "blank", content: "" },
        ]));
      }
      return;
    }

    if (verb === "exit" || verb === "quit" || verb === "back") {
      appendLines(makeLines([
        { type: "output", content: "Closing terminal session..." },
        { type: "blank", content: "" },
      ]));
      setTimeout(() => router.back(), 400);
      return;
    }

    if (verb === "sudo") {
      appendLines(makeLines([
        { type: "error", content: "Permission denied. (This is a personal AI site, not a server.)" },
        { type: "blank", content: "" },
      ]));
      return;
    }

    if (verb === "version" || verb === "ver" || verb === "uname") {
      appendLines(makeLines([
        { type: "output", content: "AI_SITE OS v2.0.26 (Next.js 15 + AI SDK 6 + React Flow)" },
        { type: "blank", content: "" },
      ]));
      return;
    }

    if (verb === "stop" || verb === "^c") {
      stopStreaming();
      appendLines(makeLines([
        { type: "system", content: "^C" },
        { type: "blank", content: "" },
      ]));
      setIsPending(false);
      return;
    }

    // Unknown command → send to AI
    appendLines(makeLines([
      { type: "system", content: `Routing to AI: "${cmd}"` },
      { type: "blank", content: "" },
    ]));
    void runAiQuery(cmd);
  }, [appendLines, router, runAiQuery, stopStreaming]);

  // ─── Input handling ───────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isPending) {
        stopStreaming();
        setIsPending(false);
        return;
      }
      const cmd = input;
      setInput("");
      processCommand(cmd);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIdxRef.current + 1, historyRef.current.length - 1);
      historyIdxRef.current = next;
      setInput(historyRef.current[next] ?? "");
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIdxRef.current - 1;
      historyIdxRef.current = next;
      setInput(next < 0 ? "" : (historyRef.current[next] ?? ""));
      return;
    }

    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      stopStreaming();
      appendLines(makeLines([
        { type: "system", content: "^C" },
        { type: "blank", content: "" },
      ]));
      setIsPending(false);
      setInput("");
      return;
    }

    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const commands = ["help", "about", "projects", "skills", "contact", "status", "goto ", "clear", "version"];
      const match = commands.find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
      return;
    }
  }, [appendLines, input, isPending, processCommand, stopStreaming]);

  const lineColor = useMemo(() => ({
    input: "text-white/90",
    output: "text-[#a8ffc0]/80",
    error: "text-red-400/90",
    ai: "text-[#c8e6ff]/85",
    system: "text-[#00ff50]/70",
    blank: "",
  }), []);

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-black font-mono"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,80,0.2) 2px, rgba(0,255,80,0.2) 4px)",
        }}
      />

      {/* Top bar */}
      <div className="z-20 flex shrink-0 items-center justify-between border-b border-[#00ff50]/10 bg-[#000d00]/80 px-5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button
              className="group relative h-2.5 w-2.5 rounded-full bg-red-500/70 transition-colors hover:bg-red-400"
              onClick={() => router.back()}
              title="Close (ESC)"
              type="button"
            >
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-red-900 opacity-0 group-hover:opacity-100">✕</span>
            </button>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#00ff50]/70" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#00ff50]/50">
            user@ai — terminal
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[#00ff50]/30">
          <span>v2.0.26</span>
          <span className="flex items-center gap-1.5">
            <span className={["h-1.5 w-1.5 rounded-full", isPending ? "animate-pulse bg-yellow-400" : "bg-[#00ff50]/60"].join(" ")} />
            {isPending ? "processing" : "ready"}
          </span>
        </div>
      </div>

      {/* Output area */}
      <div
        className="z-20 flex-1 overflow-y-auto px-5 py-4"
        ref={outputRef}
        style={{ scrollbarWidth: "thin", scrollbarColor: "#00ff50/20 transparent" }}
      >
        {lines.map((line) => {
          // Defensive guard: skip any undefined entries (should not happen after the boot-sequence fix)
          if (!line) return null;
          return (
            <div
              className={["whitespace-pre-wrap break-words text-[13px] leading-6", lineColor[line.type]].join(" ")}
              key={line.id}
            >
              {line.type === "blank" ? "\u00a0" : line.content}
              {line.streaming && line.content.length > 0 && (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-[blink_0.7s_step-end_infinite] bg-[#c8e6ff]/80" />
              )}
            </div>
          );
        })}

        {/* Input line */}
        <div className="mt-1 flex items-center gap-2">
          <span className="shrink-0 text-[13px] leading-6 text-[#00ff50]/70">{prompt}</span>
          <div className="relative flex-1">
            <input
              className="w-full bg-transparent text-[13px] leading-6 text-white/90 caret-[#00ff50] outline-none"
              disabled={isPending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              spellCheck={false}
              type="text"
              value={input}
              aria-label="Terminal input"
            />
            {isPending && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-wider text-yellow-400/50">
                [Enter to stop]
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="z-20 shrink-0 border-t border-[#00ff50]/10 bg-[#000d00]/60 px-5 py-2">
        <p className="text-[10px] tracking-[0.22em] text-[#00ff50]/25">
          Tab: autocomplete · ↑↓: history · Ctrl+C: stop · Ctrl+L: clear · ESC / exit: close
        </p>
      </div>
    </div>
  );
}
