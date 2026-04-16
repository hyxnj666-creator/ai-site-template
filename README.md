# AI Site

An open-source, AI-native personal website template with cinematic design, intelligent interactions, and a self-evolving knowledge base.

Built with **Next.js 16**, **React 19**, **AI SDK 6**, **WebGPU**, and a custom design system.

---

## Features

- **AI Chat with Tool Calling** — conversational AI agent that can navigate the site, switch themes, render rich UI artifacts
- **Generative UI** — AI-driven UI actions via tool calls (navigation, theme switching, skill visualization, project cards)
- **RAG Knowledge Base** — pgvector-powered retrieval-augmented generation with auto-ingestion
- **WebGPU Particle System** — GPU-accelerated particle flow field with Canvas 2D fallback and mouse interaction
- **Anonymous Live Cursors** — Figma-style real-time multi-cursor via Server-Sent Events
- **Model Arena** — side-by-side GPT vs Claude streaming comparison
- **Workflow Studio** — visual workflow editor built with React Flow
- **Agent OS Console** — session management, run tracing, tool call inspection
- **Coding DNA** — live GitHub stats and language distribution visualization
- **Cinematic Design System** — glass morphism, glow effects, scroll-driven animations, sound design
- **Command Palette** — ⌘K global command palette with AI chat, navigation, and terminal modes
- **i18n** — built-in Chinese / English support
- **Dark / Light Theme** — full theme support with system preference detection
- **Mobile Responsive** — adaptive layout, touch-friendly, performance degradation on mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| Runtime | React 19, TypeScript 5 (strict) |
| Styling | Tailwind CSS 4, CSS variables, next-themes |
| Animation | Motion (Framer Motion) 12, CSS scroll-driven animations, View Transitions API |
| AI | Vercel AI SDK 6, OpenAI, Anthropic, pgvector RAG |
| Graphics | WebGPU (WGSL shaders), Canvas 2D fallback |
| Workflow | @xyflow/react (React Flow) |
| Command Palette | cmdk |
| Database | PostgreSQL 16 + pgvector |
| Monorepo | pnpm workspaces + Turborepo |

---

## Project Structure

```
ai-site/
├── apps/
│   ├── web/                  # Next.js 16 main application
│   │   ├── src/app/          # App Router pages, layouts, API routes
│   │   ├── src/components/   # UI components
│   │   ├── src/hooks/        # Custom hooks
│   │   └── src/lib/          # Utilities (auth, AI runtime, rate limiting)
│   └── worker/               # Background job runner
├── packages/
│   ├── ai/                   # AI runtime: agents, chat, arena, workflows, artifacts
│   ├── db/                   # PostgreSQL client, repositories, schema
│   ├── ui/                   # Design system: tokens, primitives, composites
│   ├── content/              # Site copy, locales, projects, timeline data
│   ├── observability/        # LLM run tracking, tool calls, visitor sessions
│   └── config/               # Shared TypeScript config
├── ARCHITECTURE.md           # System architecture & development manual
├── CUSTOMIZATION.md          # How to personalize the template
└── turbo.json                # Turborepo pipeline config
```

---

## Quick Start

### Prerequisites

- **Node.js** 22+
- **pnpm** 10+
- **PostgreSQL** 16 with pgvector (optional — falls back to JSON files)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/ai-site.git
cd ai-site
pnpm install
```

### Configure

```bash
cp .env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_CHAT_MODEL` | Yes | Primary model (e.g. `gpt-4o`) |
| `ANTHROPIC_API_KEY` | For Arena | Anthropic API key |
| `DATABASE_URL` | Optional | PostgreSQL connection string |
| `GITHUB_ACCOUNT_USERNAME` | Yes | Your GitHub username |
| `ADMIN_BASIC_AUTH_PASSWORD` | Yes | Admin panel password |

### Run

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Build

```bash
pnpm build
```

---

## Personalization

See **[CUSTOMIZATION.md](./CUSTOMIZATION.md)** for a complete guide on how to:

- Replace the placeholder name and bio with your own
- Add your projects and career timeline
- Configure AI persona and behavior
- Customize the design system (colors, fonts, effects)
- Set up your own domain and deployment

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, capabilities, Coding DNA, Evolution Pulse |
| `/about` | About page with career timeline |
| `/ai/chat` | AI chat with multimodal input |
| `/ai/agent` | Agent mission control |
| `/ai/workflow` | Visual workflow editor |
| `/ai/knowledge` | RAG knowledge base |
| `/ai/arena` | Model Arena (GPT vs Claude) |
| `/ai/mcp` | MCP tool orchestration |
| `/ai/os` | Agent OS console |
| `/evolution` | Evolution timeline |
| `/lab` | Experiment lab |
| `/terminal` | Terminal interface |
| `/admin` | Admin dashboard (protected) |

---

## Deployment

### Vercel (Recommended)

```bash
npx vercel
```

### Self-hosted (PM2 + Nginx)

```bash
# Build locally
pnpm build

# On your server
pm2 start node_modules/next/dist/bin/next --name ai-site-web -- start -p 3000
```

### Docker (Coming Soon)

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](./LICENSE)
