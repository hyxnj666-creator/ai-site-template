import { siteLinks } from "./site-links";
import { defaultLocale, type LocalizedValue, type SiteLocale } from "./locales";

type Accent = "primary" | "secondary" | "tertiary";

export const homeContentByLocale: LocalizedValue<{
  hero: {
    eyebrow: string;
    title: string;
    chineseName: string;
    description: string;
    statusLabel: string;
    overlayTitle: string;
    overlayDescription: string;
    insights: {
      personaLabel: string;
      personaValue: string;
      focusLabel: string;
      focusValue: string;
    };
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
    metrics: Array<{ label: string; value: string }>;
    liveOnlineLabel: string;
    liveChatsLabel: string;
  };
  capabilities: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCard: {
      eyebrow: string;
      title: string;
      description: string;
      bullets: string[];
    };
    secondaryCard: {
      eyebrow: string;
      title: string;
      description: string;
      bars: number[];
      nodeLabel: string;
    };
    knowledgeCard: {
      eyebrow: string;
      title: string;
      description: string;
      tags: string[];
    };
    utilityCards: Array<{
      eyebrow: string;
      title: string;
      description: string;
      accent: Accent;
    }>;
  };
  codingDna: {
    eyebrow: string;
    title: string;
    description: string;
    metrics: Array<{ label: string; value: string }>;
    // GitHub stats labels (locale-aware)
    reposLabel: string;
    starsLabel: string;
    followersLabel: string;
    languagesLabel: string;
    activityLabel: string;
    commitsLabel: string;
    primaryLangLabel: string;
    dataLoadingLabel: string;
    dataErrorLabel: string;
    dataEmptyLabel: string;
    strands: Array<{
      token: string;
      accent: Accent;
      widthClass: string;
      shiftClass: string;
    }>;
  };
  evolutionPulse: {
    eyebrow: string;
    title: string;
    uptime: string;
    viewAllLabel: string;
    events: Array<{
      date: string;
      title: string;
      accent: Accent;
      offset: string;
    }>;
  };
  explore: {
    eyebrow: string;
    title: string;
    description: string;
    inputLabel: string;
    modes: Array<{
      title: string;
      description: string;
      accent: Accent;
    }>;
    promptExamples: string[];
    terminalLines: string[];
  };
  portalsSection: {
    eyebrow: string;
    title: string;
    description: string;
  };
  portals: Array<{
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    href: string;
    accent: Accent;
  }>;
}> = {
  zh: {
    hero: {
      eyebrow: "AI Neural Hub v1.0",
      title: "构建会思考、会进化、会展示自己的 AI 原生界面",
      chineseName: "",
      description:
        "这是一个把设计感、产品思维、工程体系和 AI 能力融合到同一张动态画布上的网站模板。它不只是展示信息，而是能解释自己、演示自己，并随着作品持续进化。",
      statusLabel: "状态：运行中",
      overlayTitle: "你好，我是 AI 助手。",
      overlayDescription:
        "这里会逐步成为一个具备推理、记忆、实验和叙事能力的活体系统。",
      insights: {
        personaLabel: "人格",
        personaValue: "冷静、精确、强调产品判断，也对设计质量有明确要求。",
        focusLabel: "当前焦点",
        focusValue:
          "把视觉语言工程化为可复用的 tokens、primitives 和沉浸式页面区块。",
      },
      primaryCta: {
        label: "进入 AI",
        href: "/ai/chat",
      },
      secondaryCta: {
        label: "看它思考",
        href: "/ai/agent",
      },
      metrics: [
        { label: "模式", value: "Living Canvas" },
        { label: "运行时", value: "AI SDK + Mastra" },
        { label: "链路", value: "Web + Worker" },
      ],
      liveOnlineLabel: "当前在线",
      liveChatsLabel: "AI 对话",
    },
    capabilities: {
      eyebrow: "能力矩阵",
      title: "一层面向公开思考的电影化操作界面",
      description:
        "首页不只是落地页，而是进入 Agents、Workflow、Memory、UI Actions 和交互实验的总入口。它需要同时具备编辑感、技术感与生命力。",
      primaryCard: {
        eyebrow: "智能体内核",
        title: "可自主编排的智能体内核",
        description:
          "复杂任务会被拆成推理步骤、工具调用和自我修正循环，让访客不只看到结果，也能看到构建与交付的过程。",
        bullets: [
          "结构化任务规划、工具调用与记忆链路",
          "围绕产品、工程与设计审美调优过的 AI persona",
          "为 artifacts、引导式导览与自适应 UI actions 预留接口",
        ],
      },
      secondaryCard: {
        eyebrow: "工作流",
        title: "可组合的工作流节点",
        description:
          "把可复用的思考过程封装成节点，为 demos、内容生成与后台自动化打基础。",
        bars: [82, 58, 91],
        nodeLabel: "节点",
      },
      knowledgeCard: {
        eyebrow: "知识系统",
        title: "知识图谱与 RAG",
        description:
          "typed content、向量索引与 observability 共同组成一个可回答、可追踪、可长期记忆的平台。",
        tags: ["pgvector", "语义检索", "typed content", "单一事实源"],
      },
      utilityCards: [
        {
          eyebrow: "MCP",
          title: "上下文桥接",
          description: "为工具、仓库与外部系统提供安全可控的连接层。",
          accent: "tertiary" as Accent,
        },
        {
          eyebrow: "竞技场",
          title: "模型对比评测",
          description: "在统一界面内比较 GPT 与 Claude 的响应与质量。",
          accent: "primary" as Accent,
        },
        {
          eyebrow: "AI UI",
          title: "界面可控层",
          description: "通过 function calling 驱动界面状态变化并渲染 artifacts。",
          accent: "secondary" as Accent,
        },
      ],
    },
    codingDna: {
      eyebrow: "Coding DNA",
      title: "严格类型系统之上的工程感与产品感",
      description:
        "整个站点会跨 web、jobs、AI runtime、content 与 observability 扩展，而不是重新坍缩回一个混乱的单体应用。",
      metrics: [
        { label: "架构", value: "Monorepo-first" },
        { label: "风格", value: "TypeScript-heavy" },
        { label: "回路", value: "Design x AI x Product" },
      ],
      reposLabel: "开源仓库",
      starsLabel: "获得 Stars",
      followersLabel: "关注者",
      languagesLabel: "语言分布",
      activityLabel: "提交活动 · 近 30 天",
      commitsLabel: "次提交",
      primaryLangLabel: "主要语言",
      dataLoadingLabel: "GitHub 数据加载中…",
      dataErrorLabel: "GitHub 数据加载失败，请稍后再试。",
      dataEmptyLabel: "暂无语言分布数据。",
      strands: [
        { token: "0x4F2A...99", accent: "primary" as Accent, widthClass: "w-64", shiftClass: "" },
        { token: "0x1B8C...32", accent: "secondary" as Accent, widthClass: "w-48", shiftClass: "translate-x-10" },
        { token: "0x9E4D...01", accent: "tertiary" as Accent, widthClass: "w-56", shiftClass: "-translate-x-6" },
        { token: "0xC6A1...44", accent: "primary" as Accent, widthClass: "w-40", shiftClass: "translate-x-4" },
      ],
    },
    evolutionPulse: {
      eyebrow: "Evolution Pulse",
      title: "穿过系统的持续进化事件",
      uptime: "Phase 1 在线",
      viewAllLabel: "查看完整进化日志 →",
      events: [
        {
          date: "2024-01-15",
          title: "项目启动 + 技术选型",
          accent: "primary" as Accent,
          offset: "8%",
        },
        {
          date: "2024-06-01",
          title: "AI Chat + RAG 知识库上线",
          accent: "secondary" as Accent,
          offset: "30%",
        },
        {
          date: "2025-01-10",
          title: "AI 平台正式发布",
          accent: "tertiary" as Accent,
          offset: "55%",
        },
        {
          date: "2025-06-01",
          title: "开源工具集发布",
          accent: "primary" as Accent,
          offset: "76%",
        },
        {
          date: "NEXT",
          title: "Agent OS + 知识摄取",
          accent: "secondary" as Accent,
          offset: "91%",
        },
      ],
    },
    explore: {
      eyebrow: "与 AI 共探索",
      title: "在意图驱动与底层透明之间自由切换",
      description:
        "体验可以从自然语言命令流转到可检查的技术界面，让访客同时感知产品完成度与系统深度。",
      inputLabel: "你可以直接问任何问题...",
      modes: [
        {
          title: "命令面板",
          description: "用自然语言驱动 demos、导航与后续的 AI UI actions。",
          accent: "primary" as Accent,
        },
        {
          title: "终端模式",
          description: "以更底层的方式查看运行轨迹、任务链路与基础设施人格。",
          accent: "secondary" as Accent,
        },
      ],
      promptExamples: [
        "总结最近在做的 AI 实验",
        "解释工作流引擎是怎么组织的",
        "对比 GPT-5 和 Claude 在同一任务上的表现",
      ],
      terminalLines: [
        "$ ai-site --boot living-canvas",
        "[ok] loading content schemas",
        "[ok] mounting agent registry",
        "[ok] syncing worker heartbeat",
        "> awaiting next visitor intent",
      ],
    },
    portalsSection: {
      eyebrow: "访问入口",
      title: "三个清晰入口，通往不同维度",
      description:
        "Resume 与 Blog 会保持独立站点，这里则是更智能的入口层，把访客引导到最合适的上下文。",
    },
    portals: [
      {
        eyebrow: "履历",
        title: "Resume",
        description:
          "单独聚焦于经历、技能与既有成果的正式叙事入口。",
        cta: "打开入口",
        href: siteLinks.resume,
        accent: "primary" as Accent,
      },
      {
        eyebrow: "观点",
        title: "Blog",
        description:
          "围绕 AI 系统、产品审美和工程判断的文章、技术记录与长文思考。",
        cta: "打开入口",
        href: siteLinks.blog,
        accent: "secondary" as Accent,
      },
      {
        eyebrow: "源码",
        title: "GitHub",
        description:
          "查看支撑这套 living interface 的代码、实验与实现细节。",
        cta: "打开入口",
        href: siteLinks.github,
        accent: "tertiary" as Accent,
      },
    ],
  },
  en: {
    hero: {
      eyebrow: "AI Neural Hub v1.0",
      title: "AI-native template for building a living interface",
      chineseName: "",
      description:
        "A website template where design, product thinking, and AI systems converge into one adaptive surface. It explains itself, demos itself, and evolves with the work behind it.",
      statusLabel: "Status: Operational",
      overlayTitle: "Welcome. I'm your AI assistant.",
      overlayDescription:
        "This site is becoming a living system for reasoning, memory, experiments, and product storytelling.",
      insights: {
        personaLabel: "Persona",
        personaValue:
          "Calm, precise, product-minded, and opinionated about design quality.",
        focusLabel: "Current Focus",
        focusValue:
          "Engineering the visual language into reusable tokens, primitives, and living homepage sections.",
      },
      primaryCta: {
        label: "Enter the AI",
        href: "/ai/chat",
      },
      secondaryCta: {
        label: "Watch it think",
        href: "/ai/agent",
      },
      metrics: [
        { label: "Mode", value: "Living Canvas" },
        { label: "Runtime", value: "AI SDK + Mastra" },
        { label: "Ops", value: "Web + Worker" },
      ],
      liveOnlineLabel: "Online Now",
      liveChatsLabel: "AI Chats",
    },
    capabilities: {
      eyebrow: "Capabilities",
      title: "A cinematic operating layer for thinking in public",
      description:
        "The homepage is the gateway into agents, workflows, memory, UI actions, and interaction experiments. It should feel editorial, technical, and alive at the same time.",
      primaryCard: {
        eyebrow: "Agent Core",
        title: "Autonomous agent orchestration",
        description:
          "Complex tasks are decomposed into reasoning steps, tool calls, and self-correcting loops so visitors can see both the results and the process behind them.",
        bullets: [
          "Structured task planning with tools and memory",
          "AI persona tuned for product, engineering, and design taste",
          "Ready for artifacts, guided tours, and adaptive UI actions",
        ],
      },
      secondaryCard: {
        eyebrow: "Workflow",
        title: "Composable workflow nodes",
        description:
          "Workflows package repeatable thinking into reusable nodes for demos, content generation, and future admin automations.",
        bars: [82, 58, 91],
        nodeLabel: "Node",
      },
      knowledgeCard: {
        eyebrow: "Knowledge",
        title: "Knowledge graph + RAG",
        description:
          "Typed content, vectors, and observability make the platform answerable, inspectable, and ready for long-term memory.",
        tags: ["pgvector", "semantics", "typed content", "source of truth"],
      },
      utilityCards: [
        {
          eyebrow: "MCP",
          title: "Context bridges",
          description: "Safe connectors for tools, repos, and external systems.",
          accent: "tertiary" as Accent,
        },
        {
          eyebrow: "Arena",
          title: "Model evaluation",
          description: "Compare GPT and Claude responses inside one controlled UI.",
          accent: "primary" as Accent,
        },
        {
          eyebrow: "AI UI",
          title: "Interface control",
          description: "Function calling that can mutate surface state and render artifacts.",
          accent: "secondary" as Accent,
        },
      ],
    },
    codingDna: {
      eyebrow: "Coding DNA",
      title: "Strictly typed foundations with product instincts",
      description:
        "The platform is engineered to scale across web, jobs, AI runtime, content, and observability without collapsing into a single app folder.",
      metrics: [
        { label: "Architecture", value: "Monorepo-first" },
        { label: "Style", value: "TypeScript-heavy" },
        { label: "Loop", value: "Design x AI x Product" },
      ],
      reposLabel: "Open Source",
      starsLabel: "Stars",
      followersLabel: "Followers",
      languagesLabel: "Language Distribution",
      activityLabel: "Commit Activity · 30d",
      commitsLabel: "commits",
      primaryLangLabel: "Primary Language",
      dataLoadingLabel: "GitHub data loading…",
      dataErrorLabel: "Failed to load GitHub data. Please try again later.",
      dataEmptyLabel: "No language data available yet.",
      strands: [
        { token: "0x4F2A...99", accent: "primary" as Accent, widthClass: "w-64", shiftClass: "" },
        { token: "0x1B8C...32", accent: "secondary" as Accent, widthClass: "w-48", shiftClass: "translate-x-10" },
        { token: "0x9E4D...01", accent: "tertiary" as Accent, widthClass: "w-56", shiftClass: "-translate-x-6" },
        { token: "0xC6A1...44", accent: "primary" as Accent, widthClass: "w-40", shiftClass: "translate-x-4" },
      ],
    },
    evolutionPulse: {
      eyebrow: "Evolution Pulse",
      title: "Evolution events moving through the system",
      uptime: "Phase 1 online",
      viewAllLabel: "View full evolution log →",
      events: [
        {
          date: "JAN 15 2024",
          title: "Project kickoff + tech stack selection",
          accent: "primary" as Accent,
          offset: "8%",
        },
        {
          date: "JUN 01 2024",
          title: "AI Chat + RAG knowledge base live",
          accent: "secondary" as Accent,
          offset: "30%",
        },
        {
          date: "JAN 10 2025",
          title: "AI platform officially launched",
          accent: "tertiary" as Accent,
          offset: "55%",
        },
        {
          date: "JUN 01 2025",
          title: "Open source toolkit released",
          accent: "primary" as Accent,
          offset: "76%",
        },
        {
          date: "NEXT",
          title: "Agent OS + knowledge ingestion",
          accent: "secondary" as Accent,
          offset: "91%",
        },
      ],
    },
    explore: {
      eyebrow: "Explore with AI",
      title: "Switch between guided intent and raw terminal energy",
      description:
        "The experience can flow from natural language prompts into inspectable technical surfaces, so visitors see both product polish and systems depth.",
      inputLabel: "Ask anything...",
      modes: [
        {
          title: "Command Palette",
          description: "Natural language control for demos, navigation, and future AI UI actions.",
          accent: "primary" as Accent,
        },
        {
          title: "Terminal Mode",
          description: "A lower-level view for runtime traces, jobs, and infrastructure personality.",
          accent: "secondary" as Accent,
        },
      ],
      promptExamples: [
        "Summarize the latest AI experiments",
        "Show how the workflow engine is organized",
        "Compare GPT-5 and Claude on the same task",
      ],
      terminalLines: [
        "$ ai-site --boot living-canvas",
        "[ok] loading content schemas",
        "[ok] mounting agent registry",
        "[ok] syncing worker heartbeat",
        "> awaiting next visitor intent",
      ],
    },
    portalsSection: {
      eyebrow: "Access Portals",
      title: "Three focused entry points into the platform",
      description:
        "Resume and blog stay as dedicated destinations. The personal site becomes the intelligent layer that routes people into the right context.",
    },
    portals: [
      {
        eyebrow: "The History",
        title: "Resume",
        description:
          "A focused profile for experience, skills, and the polished narrative of what has already been built.",
        cta: "Open portal",
        href: siteLinks.resume,
        accent: "primary" as Accent,
      },
      {
        eyebrow: "The Vision",
        title: "Blog",
        description:
          "Essays, technical notes, and long-form thinking around AI systems, product taste, and engineering decisions.",
        cta: "Open portal",
        href: siteLinks.blog,
        accent: "secondary" as Accent,
      },
      {
        eyebrow: "The Source",
        title: "GitHub",
        description:
          "Code, experiments, and implementation detail for the systems powering the living interface.",
        cta: "Open portal",
        href: siteLinks.github,
        accent: "tertiary" as Accent,
      },
    ],
  },
};

export const homeContent = homeContentByLocale[defaultLocale];

export function getHomeContent(locale: SiteLocale) {
  return homeContentByLocale[locale];
}
