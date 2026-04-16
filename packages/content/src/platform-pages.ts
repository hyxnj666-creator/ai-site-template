import { defaultLocale, type LocalizedValue, type SiteLocale } from "./locales";

type Accent = "primary" | "secondary" | "tertiary";

interface MetricItem {
  accent: Accent;
  label: string;
  value: string;
}

interface LinkCardItem {
  accent: Accent;
  cta: string;
  description: string;
  eyebrow: string;
  href: string;
  title: string;
}

interface TimelineItem {
  accent: Accent;
  date: string;
  description: string;
  title: string;
}

interface LogItem {
  accent: Accent;
  detail: string;
  status: string;
  title: string;
}

interface LabExperimentItem {
  accent: Accent;
  description: string;
  eyebrow: string;
  insights: string[];
  metrics: Array<{ label: string; value: string }>;
  slug: string;
  status: string;
  title: string;
  track: string;
}

interface PlatformPagesContent {
  admin: {
    cards: LinkCardItem[];
    metrics: MetricItem[];
    timeline: TimelineItem[];
  };
  adminEvolution: {
    controls: Array<{
      accent: Accent;
      description: string;
      label: string;
    }>;
    digest: {
      bullets: string[];
      title: string;
    };
    metrics: MetricItem[];
    timeline: TimelineItem[];
  };
  adminJobs: {
    logs: string[];
    recentRuns: Array<{
      accent: Accent;
      duration: string;
      name: string;
      status: string;
    }>;
    schedules: Array<{
      accent: Accent;
      cron: string;
      name: string;
      nextRun: string;
    }>;
  };
  adminObservability: {
    metrics: MetricItem[];
    sessions: Array<{
      accent: Accent;
      location: string;
      state: string;
      summary: string;
      title: string;
    }>;
    traces: LogItem[];
  };
  aiHub: {
    hero: {
      ctaLabel: string;
      description: string;
      inputLabel: string;
      promptExamples: string[];
      status: string;
      terminalLines: string[];
      title: string;
    };
    metrics: MetricItem[];
    modules: LinkCardItem[];
  };
  evolution: {
    hero: {
      description: string;
      eyebrow: string;
      title: string;
    };
    pillars: Array<{
      accent: Accent;
      description: string;
      eyebrow: string;
      title: string;
    }>;
    timeline: TimelineItem[];
  };
  lab: {
    experiments: LabExperimentItem[];
    hero: {
      description: string;
      eyebrow: string;
      title: string;
    };
  };
  mcp: {
    capabilities: Array<{
      accent: Accent;
      description: string;
      title: string;
    }>;
    logs: string[];
    recentCalls: Array<{
      accent: Accent;
      target: string;
      tool: string;
    }>;
    registry: MetricItem[];
    safeguards: Array<{
      accent: Accent;
      description: string;
      title: string;
    }>;
    hero: {
      description: string;
      eyebrow: string;
      status: string;
      title: string;
    };
  };
}

export const platformPagesByLocale: LocalizedValue<PlatformPagesContent> = {
  zh: {
    admin: {
      cards: [
        {
          accent: "primary",
          cta: "查看 Traces",
          description: "LLM runs、tool calls、session 轨迹与关键事件流的统一入口。",
          eyebrow: "Observability",
          href: "/admin/observability",
          title: "Live Signal Deck",
        },
        {
          accent: "secondary",
          cta: "进入 Jobs",
          description: "Worker 调度、同步任务、失败重试与 cron 视图。",
          eyebrow: "Jobs",
          href: "/admin/jobs",
          title: "Job Orchestrator",
        },
        {
          accent: "tertiary",
          cta: "进入 Evolution",
          description: "知识同步、digest 预览、成长事件与内容摄入控制。",
          eyebrow: "Evolution",
          href: "/admin/evolution",
          title: "Growth Controls",
        },
      ],
      metrics: [
        { accent: "primary", label: "Live Sessions", value: "128" },
        { accent: "secondary", label: "Worker Health", value: "97%" },
        { accent: "tertiary", label: "Weekly Digest", value: "Ready" },
      ],
      timeline: [
        {
          accent: "primary",
          date: "10 min ago",
          description: "新增 Agent / Arena / Workflow / Knowledge 实页骨架并完成生产构建验证。",
          title: "Phase 1 page shells synced",
        },
        {
          accent: "secondary",
          date: "34 min ago",
          description: "重新构建 knowledge context，确保 chat 引用与新页面文案一致。",
          title: "Context pipeline refreshed",
        },
        {
          accent: "tertiary",
          date: "Today",
          description: "预留 Evolution controls，用于未来 Resume / Blog ingestion 接入。",
          title: "Growth controls reserved",
        },
      ],
    },
    adminEvolution: {
      controls: [
        {
          accent: "primary",
          description: "重新计算内容 embedding、更新时间戳和 sources 排名。",
          label: "Rebuild Knowledge Index",
        },
        {
          accent: "secondary",
          description: "执行 GitHub / Blog 同步并刷新 Evolution timeline。",
          label: "Run Sync Pipeline",
        },
        {
          accent: "tertiary",
          description: "生成本周成长摘要，后续将投递到首页与管理台。",
          label: "Generate Weekly Digest",
        },
      ],
      digest: {
        bullets: [
          "本周重点：Stitch design system 已扩到 4 张真实 AI 页面。",
          "核心变化：`/ai/chat`、`/ai` hub、`/ai/mcp`、`/admin` 页面仍在继续对齐参考母版。",
          "下一步：完成剩余 placeholder 页面壳层后，再考虑 Phase 2 的 Resume AI demo 迁移。",
        ],
        title: "Digest Preview",
      },
      metrics: [
        { accent: "primary", label: "Index Version", value: "v1.4" },
        { accent: "secondary", label: "Last Sync", value: "6 min" },
        { accent: "tertiary", label: "Digest Status", value: "Draft" },
      ],
      timeline: [
        {
          accent: "primary",
          date: "2026-04-10",
          description: "AI 页面骨架首次从 placeholder 升级为真实 Stitch 风格页面。",
          title: "AI page reality pass",
        },
        {
          accent: "secondary",
          date: "2026-04-10",
          description: "知识检索接入 `DESIGN.md`、`MEMORY.md` 与 typed content。",
          title: "Retrieval context expanded",
        },
        {
          accent: "tertiary",
          date: "Upcoming",
          description: "准备纳入 GitHub sync、weekly digest 与 Coding DNA 重建流程。",
          title: "Autonomous evolution queue",
        },
      ],
    },
    adminJobs: {
      logs: [
        "worker:init -> schedule registry loaded",
        "[09:00] weeklyDigest queued",
        "[09:01] githubSync completed in 1.8s",
        "[09:04] codingDnaRebuild refreshed homepage fingerprint",
        "[09:07] metricsAggregate published admin snapshot",
        "_",
      ],
      recentRuns: [
        {
          accent: "secondary",
          duration: "1.8s",
          name: "githubSync",
          status: "completed",
        },
        {
          accent: "primary",
          duration: "1.0s",
          name: "codingDnaRebuild",
          status: "completed",
        },
        {
          accent: "tertiary",
          duration: "0.7s",
          name: "metricsAggregate",
          status: "completed",
        },
      ],
      schedules: [
        {
          accent: "secondary",
          cron: "*/30 * * * *",
          name: "GitHub Sync",
          nextRun: "12 min later",
        },
        {
          accent: "primary",
          cron: "0 */6 * * *",
          name: "Blog Sync",
          nextRun: "3h 12m",
        },
        {
          accent: "tertiary",
          cron: "15 */4 * * *",
          name: "Coding DNA Rebuild",
          nextRun: "48 min later",
        },
        {
          accent: "primary",
          cron: "*/20 * * * *",
          name: "Metrics Aggregate",
          nextRun: "19 min later",
        },
        {
          accent: "tertiary",
          cron: "0 9 * * 1",
          name: "Weekly Digest",
          nextRun: "Mon 09:00",
        },
        {
          accent: "secondary",
          cron: "0 2 * * *",
          name: "Knowledge Ingest",
          nextRun: "02:00 tomorrow",
        },
      ],
    },
    adminObservability: {
      metrics: [
        { accent: "primary", label: "LLM Runs", value: "248" },
        { accent: "secondary", label: "Tool Calls", value: "91" },
        { accent: "tertiary", label: "UI Actions", value: "34" },
      ],
      sessions: [
        {
          accent: "primary",
          location: "Shanghai",
          state: "exploring /ai/chat",
          summary: "查看 sources 与 follow-ups，对站点架构发起多轮追问。",
          title: "Visitor Session 14AF",
        },
        {
          accent: "secondary",
          location: "Singapore",
          state: "navigating /ai/arena",
          summary: "对比模型页面停留较久，点击了 Hall of Fame 与 Cast your verdict。",
          title: "Visitor Session 90KQ",
        },
      ],
      traces: [
        {
          accent: "primary",
          detail: "Loaded `DESIGN.md`, `MEMORY.md`, and typed content before GPT response generation.",
          status: "completed",
          title: "retrieveKnowledge",
        },
        {
          accent: "secondary",
          detail: "Palette routed a natural language query into `/ai/chat?prompt=...`.",
          status: "completed",
          title: "commandPalette",
        },
        {
          accent: "tertiary",
          detail: "Tour overlay persisted `lastStepId` and resumed from prior session state.",
          status: "completed",
          title: "homeTourMemory",
        },
      ],
    },
    aiHub: {
      hero: {
        ctaLabel: "OPEN SURFACE",
        description:
          "把 Chat、Agent、Workflow、Knowledge、MCP 与 Arena 组织成同一个可导航的智能入口，而不是割裂的 demo 列表。",
        inputLabel: "Search, navigate, or ask AI...",
        promptExamples: [
          "帮我理解这套网站的 AI 架构",
          "打开 Agent Mission Control",
          "比较 GPT-5 与 Claude 在这个站点里的定位",
        ],
        status: "Living interface online",
        terminalLines: [
          "$ route --surface ai-site",
          "[ok] agent mission control",
          "[ok] workflow editor",
          "[ok] knowledge archive",
          "[ok] protocol bridge",
        ],
        title: "AI 平台是这个站点的神经入口",
      },
      metrics: [
        { accent: "primary", label: "Surfaces", value: "7 live" },
        { accent: "secondary", label: "Runtime", value: "GPT-first" },
        { accent: "tertiary", label: "Context", value: "RAG warm" },
      ],
      modules: [
        {
          accent: "primary",
          cta: "进入对话",
          description: "流式回复、sources、tool calls 与后续 artifacts 的真实对话层。",
          eyebrow: "Chat",
          href: "/ai/chat",
          title: "Neural Chat",
        },
        {
          accent: "secondary",
          cta: "看它执行",
          description: "把 planning、tool call、observe、respond 的全过程可视化。",
          eyebrow: "Agent",
          href: "/ai/agent",
          title: "Mission Control",
        },
        {
          accent: "primary",
          cta: "进入画布",
          description: "Figma 风格的 workflow 节点编排与执行日志预览。",
          eyebrow: "Workflow",
          href: "/ai/workflow",
          title: "Sentient Flow",
        },
        {
          accent: "secondary",
          cta: "搜索记忆",
          description: "基于 typed content 与 markdown 文档的本地知识检索层。",
          eyebrow: "Knowledge",
          href: "/ai/knowledge",
          title: "Knowledge Archive",
        },
        {
          accent: "tertiary",
          cta: "查看桥接层",
          description: "展示协议驱动的工具发现、能力目录与安全边界。",
          eyebrow: "MCP",
          href: "/ai/mcp",
          title: "Protocol Bridge",
        },
        {
          accent: "secondary",
          cta: "发起对决",
          description: "把 GPT 与 Claude 放进统一竞技场进行实时比较。",
          eyebrow: "Arena",
          href: "/ai/arena",
          title: "Model Arena",
        },
        {
          accent: "tertiary",
          cta: "进入控制台",
          description: "实时监控全部 AI 接入面——会话追踪、工具链路、知识索引与策略执行。",
          eyebrow: "Agent OS",
          href: "/ai/os",
          title: "Agent OS Console",
        },
      ],
    },
    evolution: {
      hero: {
        description: "这里记录知识同步、页面升级、AI 能力扩展与未来自进化事件，不再只是静态更新日志。",
        eyebrow: "Evolution Pulse",
        title: "系统正在持续变得更像一个活体平台",
      },
      pillars: [
        {
          accent: "primary",
          description: "把设计方案、开发记忆与 typed content 统一成可检索的长期记忆层。",
          eyebrow: "Memory",
          title: "Long-term context",
        },
        {
          accent: "secondary",
          description: "让 worker、sync pipeline 与 digest generation 逐步脱离请求链路独立运行。",
          eyebrow: "Autonomy",
          title: "Background evolution",
        },
        {
          accent: "tertiary",
          description: "把 UI、AI、内容和观测数据收束为一套可持续扩张的工程系统。",
          eyebrow: "System",
          title: "Composable foundation",
        },
      ],
      timeline: [
        {
          accent: "primary",
          date: "2026-04-10",
          description: "Phase 1 首页与 AI 页面开始从 placeholder 转为真实 Stitch 参考页面。",
          title: "Stitch UI entered production",
        },
        {
          accent: "secondary",
          date: "2026-04-10",
          description: "Chat runtime 切换为 GPT，sources 来自本地知识检索而不是静态占位。",
          title: "Live GPT context layer",
        },
        {
          accent: "tertiary",
          date: "Next",
          description: "GitHub / Blog sync、weekly digest 与 Coding DNA 会成为下一批演化事件。",
          title: "Autonomous growth backlog",
        },
      ],
    },
    lab: {
      experiments: [
        {
          accent: "primary",
          description: "让对话直接产出可交互 artifact 卡片，而不是停留在文字回答。",
          eyebrow: "Generative UI",
          insights: [
            "对话内代码/图表/诊断卡片",
            "function calling -> UI actions",
            "更强的 sources 与 context coupling",
          ],
          metrics: [
            { label: "Track", value: "AI UI Runtime" },
            { label: "State", value: "Scaffolded" },
            { label: "Priority", value: "P1" },
          ],
          slug: "artifact-radar",
          status: "Scaffolded",
          title: "Artifact Radar",
          track: "AI UI",
        },
        {
          accent: "secondary",
          description: "尝试 voice input / output、实时中断与多模态上下文融合。",
          eyebrow: "Voice Agent",
          insights: [
            "streaming voice interface",
            "interruptible interaction loop",
            "voice memory checkpoints",
          ],
          metrics: [
            { label: "Track", value: "Voice" },
            { label: "State", value: "Planned" },
            { label: "Priority", value: "P2" },
          ],
          slug: "voice-agent-field-notes",
          status: "Planned",
          title: "Voice Agent Field Notes",
          track: "Multimodal",
        },
        {
          accent: "tertiary",
          description: "探索多个角色型 agents 的协作轨迹、冲突与调度方式。",
          eyebrow: "Multi-Agent",
          insights: [
            "planner / researcher / critic lanes",
            "shared task memory",
            "visual collaboration timeline",
          ],
          metrics: [
            { label: "Track", value: "Agents" },
            { label: "State", value: "Research" },
            { label: "Priority", value: "P2" },
          ],
          slug: "multi-agent-orchestra",
          status: "Research",
          title: "Multi-Agent Orchestra",
          track: "Agents",
        },
      ],
      hero: {
        description: "未来实验不直接混进主叙事，而是在这里以可试验、可失败、可持续进化的方式生长。",
        eyebrow: "Experiment Lab",
        title: "这里存放下一阶段的高风险高亮度实验",
      },
    },
    mcp: {
      capabilities: [
        {
          accent: "primary",
          description: "把协议接口与 UI action、tool registry 对齐，避免 agent 直接越权访问。",
          title: "Protocol-first routing",
        },
        {
          accent: "secondary",
          description: "保留工具发现与执行日志，让能力接入链路具备可观察性。",
          title: "Inspectable execution",
        },
        {
          accent: "tertiary",
          description: "为未来接入外部系统、仓库与服务保留统一的安全边界。",
          title: "Controlled surface area",
        },
      ],
      logs: [
        "$ mcp:list --surface ai-site",
        "[ok] filesystem.readonly",
        "[ok] github.issue_search",
        "[ok] browser.fetch",
        "[pending] deploy.ecs",
        "_",
      ],
      recentCalls: [
        { accent: "primary", target: "DESIGN.md", tool: "filesystem.read" },
        { accent: "secondary", target: "GitHub Issues", tool: "github.search" },
        { accent: "tertiary", target: "Deploy Queue", tool: "deploy.prepare" },
      ],
      registry: [
        { accent: "primary", label: "Adapters", value: "08" },
        { accent: "secondary", label: "Policies", value: "14" },
        { accent: "tertiary", label: "Pending Auth", value: "01" },
      ],
      safeguards: [
        {
          accent: "primary",
          description: "把不同工具按 server、权限和调用风险拆成明确层级。",
          title: "Capability zoning",
        },
        {
          accent: "secondary",
          description: "强制 schema-first 调用，先读 descriptor 再执行工具。",
          title: "Schema gate",
        },
        {
          accent: "tertiary",
          description: "把长时任务与高风险操作留给独立 worker 或人工确认。",
          title: "Human fallback",
        },
      ],
      hero: {
        description: "MCP 页面不是功能清单，而是展示 agent 如何安全地发现、理解并连接到真实工具能力。",
        eyebrow: "MCP Interface",
        status: "Protocol bridge online",
        title: "把工具协议变成可控、可解释、可扩展的能力桥梁",
      },
    },
  },
  en: {
    admin: {
      cards: [
        {
          accent: "primary",
          cta: "Open traces",
          description:
            "A unified surface for LLM runs, tool calls, session trails, and key event streams.",
          eyebrow: "Observability",
          href: "/admin/observability",
          title: "Live Signal Deck",
        },
        {
          accent: "secondary",
          cta: "Open jobs",
          description:
            "Worker scheduling, sync tasks, failure recovery, and cron visibility.",
          eyebrow: "Jobs",
          href: "/admin/jobs",
          title: "Job Orchestrator",
        },
        {
          accent: "tertiary",
          cta: "Open evolution",
          description:
            "Knowledge sync, digest preview, growth events, and ingestion controls.",
          eyebrow: "Evolution",
          href: "/admin/evolution",
          title: "Growth Controls",
        },
      ],
      metrics: [
        { accent: "primary", label: "Live Sessions", value: "128" },
        { accent: "secondary", label: "Worker Health", value: "97%" },
        { accent: "tertiary", label: "Weekly Digest", value: "Ready" },
      ],
      timeline: [
        {
          accent: "primary",
          date: "10 min ago",
          description:
            "The first real Agent / Arena / Workflow / Knowledge pages landed and passed production builds.",
          title: "Phase 1 page shells synced",
        },
        {
          accent: "secondary",
          date: "34 min ago",
          description:
            "The knowledge context pipeline was rebuilt so chat citations stay aligned with the new page copy.",
          title: "Context pipeline refreshed",
        },
        {
          accent: "tertiary",
          date: "Today",
          description:
            "Evolution controls were reserved for future Resume and Blog ingestion.",
          title: "Growth controls reserved",
        },
      ],
    },
    adminEvolution: {
      controls: [
        {
          accent: "primary",
          description:
            "Recompute content embeddings, refresh timestamps, and rerank cited sources.",
          label: "Rebuild Knowledge Index",
        },
        {
          accent: "secondary",
          description:
            "Run GitHub and Blog sync, then refresh the evolution timeline.",
          label: "Run Sync Pipeline",
        },
        {
          accent: "tertiary",
          description:
            "Generate the weekly growth summary that later surfaces on the homepage and admin.",
          label: "Generate Weekly Digest",
        },
      ],
      digest: {
        bullets: [
          "Primary theme: the Stitch design system now powers four real AI pages.",
          "Core change: `/ai/chat`, `/ai` hub, `/ai/mcp`, and `/admin` surfaces are next in line for full reference alignment.",
          "Next step: finish the remaining placeholder shells before Phase 2 Resume demo migration begins.",
        ],
        title: "Digest Preview",
      },
      metrics: [
        { accent: "primary", label: "Index Version", value: "v1.4" },
        { accent: "secondary", label: "Last Sync", value: "6 min" },
        { accent: "tertiary", label: "Digest Status", value: "Draft" },
      ],
      timeline: [
        {
          accent: "primary",
          date: "2026-04-10",
          description:
            "AI pages were upgraded from placeholders into real Stitch-style surfaces.",
          title: "AI page reality pass",
        },
        {
          accent: "secondary",
          date: "2026-04-10",
          description:
            "Knowledge retrieval expanded to `DESIGN.md`, `MEMORY.md`, and typed content.",
          title: "Retrieval context expanded",
        },
        {
          accent: "tertiary",
          date: "Upcoming",
          description:
            "GitHub sync, weekly digest, and Coding DNA rebuild are queued as the next evolution loops.",
          title: "Autonomous evolution queue",
        },
      ],
    },
    adminJobs: {
      logs: [
        "worker:init -> schedule registry loaded",
        "[09:00] weeklyDigest queued",
        "[09:01] githubSync completed in 1.8s",
        "[09:04] codingDnaRebuild refreshed homepage fingerprint",
        "[09:07] metricsAggregate published admin snapshot",
        "_",
      ],
      recentRuns: [
        {
          accent: "secondary",
          duration: "1.8s",
          name: "githubSync",
          status: "completed",
        },
        {
          accent: "primary",
          duration: "1.0s",
          name: "codingDnaRebuild",
          status: "completed",
        },
        {
          accent: "tertiary",
          duration: "0.7s",
          name: "metricsAggregate",
          status: "completed",
        },
      ],
      schedules: [
        {
          accent: "secondary",
          cron: "*/30 * * * *",
          name: "GitHub Sync",
          nextRun: "12 min later",
        },
        {
          accent: "primary",
          cron: "0 */6 * * *",
          name: "Blog Sync",
          nextRun: "3h 12m",
        },
        {
          accent: "tertiary",
          cron: "15 */4 * * *",
          name: "Coding DNA Rebuild",
          nextRun: "48 min later",
        },
        {
          accent: "primary",
          cron: "*/20 * * * *",
          name: "Metrics Aggregate",
          nextRun: "19 min later",
        },
        {
          accent: "tertiary",
          cron: "0 9 * * 1",
          name: "Weekly Digest",
          nextRun: "Mon 09:00",
        },
        {
          accent: "secondary",
          cron: "0 2 * * *",
          name: "Knowledge Ingest",
          nextRun: "02:00 tomorrow",
        },
      ],
    },
    adminObservability: {
      metrics: [
        { accent: "primary", label: "LLM Runs", value: "248" },
        { accent: "secondary", label: "Tool Calls", value: "91" },
        { accent: "tertiary", label: "UI Actions", value: "34" },
      ],
      sessions: [
        {
          accent: "primary",
          location: "Shanghai",
          state: "exploring /ai/chat",
          summary:
            "The visitor inspected sources and follow-ups, then asked multiple architecture questions.",
          title: "Visitor Session 14AF",
        },
        {
          accent: "secondary",
          location: "Singapore",
          state: "navigating /ai/arena",
          summary:
            "The arena view held attention longer, with clicks on Hall of Fame and Cast your verdict.",
          title: "Visitor Session 90KQ",
        },
      ],
      traces: [
        {
          accent: "primary",
          detail:
            "Loaded `DESIGN.md`, `MEMORY.md`, and typed content before GPT response generation.",
          status: "completed",
          title: "retrieveKnowledge",
        },
        {
          accent: "secondary",
          detail:
            "The command palette routed a natural language query into `/ai/chat?prompt=...`.",
          status: "completed",
          title: "commandPalette",
        },
        {
          accent: "tertiary",
          detail:
            "The tour overlay persisted `lastStepId` and resumed from prior session state.",
          status: "completed",
          title: "homeTourMemory",
        },
      ],
    },
    aiHub: {
      hero: {
        ctaLabel: "OPEN SURFACE",
        description:
          "Organize Chat, Agent, Workflow, Knowledge, MCP, and Arena into one navigable intelligence layer instead of a disconnected demo list.",
        inputLabel: "Search, navigate, or ask AI...",
        promptExamples: [
          "Help me understand the AI architecture of this site",
          "Open Agent Mission Control",
          "Compare the roles of GPT-5 and Claude in this platform",
        ],
        status: "Living interface online",
        terminalLines: [
          "$ route --surface ai-site",
          "[ok] agent mission control",
          "[ok] workflow editor",
          "[ok] knowledge archive",
          "[ok] protocol bridge",
        ],
        title: "The AI platform is the neural gateway into this site",
      },
      metrics: [
        { accent: "primary", label: "Surfaces", value: "7 live" },
        { accent: "secondary", label: "Runtime", value: "GPT-first" },
        { accent: "tertiary", label: "Context", value: "RAG warm" },
      ],
      modules: [
        {
          accent: "primary",
          cta: "Enter chat",
          description:
            "The real conversation layer for streaming replies, cited sources, tool calls, and future artifacts.",
          eyebrow: "Chat",
          href: "/ai/chat",
          title: "Neural Chat",
        },
        {
          accent: "secondary",
          cta: "Watch it execute",
          description:
            "Visualize the full chain of planning, tool calling, observation, and response.",
          eyebrow: "Agent",
          href: "/ai/agent",
          title: "Mission Control",
        },
        {
          accent: "primary",
          cta: "Open canvas",
          description:
            "A Figma-like workflow canvas with nodes, execution logs, and orchestration structure.",
          eyebrow: "Workflow",
          href: "/ai/workflow",
          title: "Sentient Flow",
        },
        {
          accent: "secondary",
          cta: "Search memory",
          description:
            "The local retrieval layer powered by typed content and markdown design memory.",
          eyebrow: "Knowledge",
          href: "/ai/knowledge",
          title: "Knowledge Archive",
        },
        {
          accent: "tertiary",
          cta: "Inspect bridge",
          description:
            "Show protocol-driven tool discovery, capability registries, and security boundaries.",
          eyebrow: "MCP",
          href: "/ai/mcp",
          title: "Protocol Bridge",
        },
        {
          accent: "secondary",
          cta: "Start showdown",
          description:
            "Put GPT and Claude into a shared arena for side-by-side comparison.",
          eyebrow: "Arena",
          href: "/ai/arena",
          title: "Model Arena",
        },
        {
          accent: "tertiary",
          cta: "Open console",
          description:
            "Real-time monitoring across all AI surfaces — session tracing, tool call chains, knowledge index, and policy enforcement.",
          eyebrow: "Agent OS",
          href: "/ai/os",
          title: "Agent OS Console",
        },
      ],
    },
    evolution: {
      hero: {
        description:
          "This is where knowledge sync, page upgrades, AI capability expansion, and future self-evolving events become a visible narrative instead of a silent changelog.",
        eyebrow: "Evolution Pulse",
        title: "The system is slowly becoming more like a living platform",
      },
      pillars: [
        {
          accent: "primary",
          description:
            "Unify design docs, development memory, and typed content into a retrievable long-term context layer.",
          eyebrow: "Memory",
          title: "Long-term context",
        },
        {
          accent: "secondary",
          description:
            "Let workers, sync pipelines, and digest generation move off the request path and evolve independently.",
          eyebrow: "Autonomy",
          title: "Background evolution",
        },
        {
          accent: "tertiary",
          description:
            "Collapse UI, AI, content, and observability into one extensible engineering system.",
          eyebrow: "System",
          title: "Composable foundation",
        },
      ],
      timeline: [
        {
          accent: "primary",
          date: "2026-04-10",
          description:
            "Phase 1 homepage and AI pages started moving from placeholders to real Stitch-driven surfaces.",
          title: "Stitch UI entered production",
        },
        {
          accent: "secondary",
          date: "2026-04-10",
          description:
            "The chat runtime switched to GPT, and cited sources now come from local retrieval rather than static mock data.",
          title: "Live GPT context layer",
        },
        {
          accent: "tertiary",
          date: "Next",
          description:
            "GitHub sync, weekly digest generation, and Coding DNA rebuilds are the next visible evolution events.",
          title: "Autonomous growth backlog",
        },
      ],
    },
    lab: {
      experiments: [
        {
          accent: "primary",
          description:
            "Let conversation turns generate interactive artifact cards instead of stopping at text.",
          eyebrow: "Generative UI",
          insights: [
            "In-chat code, chart, and diagnosis cards",
            "function calling -> UI actions",
            "tighter source and context coupling",
          ],
          metrics: [
            { label: "Track", value: "AI UI Runtime" },
            { label: "State", value: "Scaffolded" },
            { label: "Priority", value: "P1" },
          ],
          slug: "artifact-radar",
          status: "Scaffolded",
          title: "Artifact Radar",
          track: "AI UI",
        },
        {
          accent: "secondary",
          description:
            "Explore voice input and output, interruption, and multimodal context fusion.",
          eyebrow: "Voice Agent",
          insights: [
            "streaming voice interface",
            "interruptible interaction loop",
            "voice memory checkpoints",
          ],
          metrics: [
            { label: "Track", value: "Voice" },
            { label: "State", value: "Planned" },
            { label: "Priority", value: "P2" },
          ],
          slug: "voice-agent-field-notes",
          status: "Planned",
          title: "Voice Agent Field Notes",
          track: "Multimodal",
        },
        {
          accent: "tertiary",
          description:
            "Study how multiple role-based agents collaborate, disagree, and hand off work.",
          eyebrow: "Multi-Agent",
          insights: [
            "planner / researcher / critic lanes",
            "shared task memory",
            "visual collaboration timeline",
          ],
          metrics: [
            { label: "Track", value: "Agents" },
            { label: "State", value: "Research" },
            { label: "Priority", value: "P2" },
          ],
          slug: "multi-agent-orchestra",
          status: "Research",
          title: "Multi-Agent Orchestra",
          track: "Agents",
        },
      ],
      hero: {
        description:
          "Future experiments should not dilute the main narrative. They live here as deliberate, high-variance explorations.",
        eyebrow: "Experiment Lab",
        title: "This is where the next high-risk, high-brightness experiments live",
      },
    },
    mcp: {
      capabilities: [
        {
          accent: "primary",
          description:
            "Align protocol surfaces with UI actions and tool registries so agents never bypass the intended boundary.",
          title: "Protocol-first routing",
        },
        {
          accent: "secondary",
          description:
            "Keep tool discovery and execution logs inspectable so capability integration remains observable.",
          title: "Inspectable execution",
        },
        {
          accent: "tertiary",
          description:
            "Reserve one security boundary for future connections to external systems, repos, and services.",
          title: "Controlled surface area",
        },
      ],
      logs: [
        "$ mcp:list --surface ai-site",
        "[ok] filesystem.readonly",
        "[ok] github.issue_search",
        "[ok] browser.fetch",
        "[pending] deploy.ecs",
        "_",
      ],
      recentCalls: [
        { accent: "primary", target: "DESIGN.md", tool: "filesystem.read" },
        { accent: "secondary", target: "GitHub Issues", tool: "github.search" },
        { accent: "tertiary", target: "Deploy Queue", tool: "deploy.prepare" },
      ],
      registry: [
        { accent: "primary", label: "Adapters", value: "08" },
        { accent: "secondary", label: "Policies", value: "14" },
        { accent: "tertiary", label: "Pending Auth", value: "01" },
      ],
      safeguards: [
        {
          accent: "primary",
          description:
            "Separate tools into explicit layers by server, permission, and execution risk.",
          title: "Capability zoning",
        },
        {
          accent: "secondary",
          description:
            "Enforce schema-first invocation so every tool call reads its descriptor before execution.",
          title: "Schema gate",
        },
        {
          accent: "tertiary",
          description:
            "Push long-running or high-risk operations into workers or human approval flows.",
          title: "Human fallback",
        },
      ],
      hero: {
        description:
          "The MCP page is not a feature checklist. It demonstrates how agents safely discover, understand, and connect to real capabilities.",
        eyebrow: "MCP Interface",
        status: "Protocol bridge online",
        title: "Turn tool protocol into a controllable, explainable, extensible capability bridge",
      },
    },
  },
};

export const platformPages = platformPagesByLocale[defaultLocale];

export function getPlatformPages(locale: SiteLocale) {
  return platformPagesByLocale[locale];
}
