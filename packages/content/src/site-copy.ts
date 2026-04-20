import { siteLinks } from "./site-links";
import {
  defaultLocale,
  type LocalizedValue,
  type SiteLocale,
} from "./locales";

export interface SiteCopy {
  shell: {
    status: string;
    githubLabel: string;
    initializeAi: string;
    themeLabel: string;
    navigation: Array<{
      href: string;
      label: string;
    }>;
  };
  footer: {
    brand: string;
    tagline: string;
    links: Array<{
      href: string;
      label: string;
    }>;
  };
  aiLayout: {
    eyebrow: string;
    title: string;
    description: string;
  };
  adminLayout: {
    eyebrow: string;
    title: string;
    description: string;
  };
  pages: {
    ai: PlaceholderPageContent;
    aiChat: PlaceholderPageContent;
    aiAgent: PlaceholderPageContent;
    aiOs: PlaceholderPageContent;
    aiWorkflow: PlaceholderPageContent;
    aiKnowledge: PlaceholderPageContent;
    aiMcp: PlaceholderPageContent;
    aiArena: PlaceholderPageContent;
    about: PlaceholderPageContent;
    evolution: PlaceholderPageContent;
    lab: PlaceholderPageContent;
    labDetail: PlaceholderPageContent;
    admin: PlaceholderPageContent;
    adminObservability: PlaceholderPageContent;
    adminJobs: PlaceholderPageContent;
    adminEvolution: PlaceholderPageContent;
  };
}

interface PlaceholderPageContent {
  eyebrow: string;
  title: string;
  description: string;
}

export const siteCopyByLocale: LocalizedValue<SiteCopy> = {
  zh: {
    shell: {
      status: "Living Interface",
      githubLabel: "GitHub",
      initializeAi: "启动 AI",
      themeLabel: "主题",
      navigation: [
        { href: "/", label: "首页" },
        { href: "/#capabilities", label: "能力" },
        { href: "/#evolution-pulse", label: "进化" },
        { href: "/ai", label: "AI" },
        { href: "/about", label: "关于" },
      ],
    },
    footer: {
      brand: "AI Site",
      tagline: "构建于 Living Void 之上。",
      links: [
        { href: siteLinks.resume, label: "简历" },
        { href: siteLinks.blog, label: "博客" },
        { href: siteLinks.source, label: "源码" },
      ],
    },
    aiLayout: {
      eyebrow: "AI 游乐场",
      title: "AI 平台",
      description: "Chat、Agents、Workflow、Knowledge、MCP、Arena",
    },
    adminLayout: {
      eyebrow: "内部控制台",
      title: "管理台",
      description: "可观测性、任务链路与进化控制",
    },
    pages: {
      ai: {
        eyebrow: "AI",
        title: "AI 游乐场",
        description: "进入 Chat、Agents、Workflow、Knowledge、MCP 与模型竞技场的统一入口。",
      },
      aiChat: {
        eyebrow: "Chat",
        title: "Neural Chat",
        description: "支持流式输出、工具轨迹、上下文注入以及后续交互式 artifacts 的 AI 对话界面。",
      },
      aiAgent: {
        eyebrow: "Agent",
        title: "Agent Mission Control",
        description: "以可视化方式展示规划、工具选择、执行过程与反思闭环。",
      },
      aiOs: {
        eyebrow: "Agent OS",
        title: "Agent OS 控制台",
        description: "实时监控 AI 运行时——活跃会话、运行追踪、工具链路、知识检索与策略执行。",
      },
      aiWorkflow: {
        eyebrow: "Workflow",
        title: "Sentient Flow",
        description: "面向 AI pipelines、编排控制与执行遥测的可视化工作流画布。",
      },
      aiKnowledge: {
        eyebrow: "Knowledge",
        title: "Knowledge Base",
        description: "基于 RAG 的检索、语义上下文和不断演进的项目知识索引。",
      },
      aiMcp: {
        eyebrow: "MCP",
        title: "MCP Interface",
        description: "为 agents 提供协议驱动的工具发现、能力接入与安全执行。",
      },
      aiArena: {
        eyebrow: "Arena",
        title: "Model Arena",
        description: "在实时指标与主观偏好投票中对比 GPT 与 Claude 的表现。",
      },
      about: {
        eyebrow: "About",
        title: "关于本站",
        description: "项目背景、技术进化轨迹，以及这套 AI 原生平台背后的设计理念。",
      },
      evolution: {
        eyebrow: "Evolution",
        title: "Evolution Log",
        description: "记录知识同步、Coding DNA 刷新和后续自进化能力的时间线。",
      },
      lab: {
        eyebrow: "Lab",
        title: "Experiment Lab",
        description: "面向未来的实验集合，包括 Generative UI、Voice Agent 与多智能体协作。",
      },
      labDetail: {
        eyebrow: "Lab Detail",
        title: "Lab Experiment",
        description: "为具体实验页面预留的动态路由骨架。",
      },
      admin: {
        eyebrow: "Admin",
        title: "Internal Console",
        description: "受保护的内部控制台，用于 observability、jobs 和 evolution 管理。",
      },
      adminObservability: {
        eyebrow: "Admin",
        title: "Observability",
        description: "LLM runs、tool calls、artifact renders 与 session visibility 将在这里集中展示。",
      },
      adminJobs: {
        eyebrow: "Admin",
        title: "Job Runs",
        description: "查看 worker 执行历史、调度计划、失败记录与重试状态。",
      },
      adminEvolution: {
        eyebrow: "Admin",
        title: "Evolution Admin",
        description: "用于检查同步状态、成长日志与生成式 digest 的内部控制界面。",
      },
    },
  },
  en: {
    shell: {
      status: "Living Interface",
      githubLabel: "GitHub",
      initializeAi: "Initialize AI",
      themeLabel: "Theme",
      navigation: [
        { href: "/", label: "Nexus" },
        { href: "/#capabilities", label: "Capabilities" },
        { href: "/#evolution-pulse", label: "Evolution" },
        { href: "/ai", label: "AI" },
        { href: "/about", label: "About" },
      ],
    },
    footer: {
      brand: "AI Site",
      tagline: "Built on the living void.",
      links: [
        { href: siteLinks.resume, label: "Resume" },
        { href: siteLinks.blog, label: "Blog" },
        { href: siteLinks.source, label: "Source" },
      ],
    },
    aiLayout: {
      eyebrow: "AI Playground",
      title: "AI Platform",
      description: "Chat, Agents, Workflow, Knowledge, MCP, Arena",
    },
    adminLayout: {
      eyebrow: "Internal Console",
      title: "Admin",
      description: "Observability, jobs, and evolution control",
    },
    pages: {
      ai: {
        eyebrow: "AI",
        title: "AI Playground",
        description: "Central gateway to chat, agents, workflows, knowledge, MCP, and model arena.",
      },
      aiChat: {
        eyebrow: "Chat",
        title: "Neural Chat",
        description: "Streaming AI conversation with tool traces, context, and future interactive artifacts.",
      },
      aiAgent: {
        eyebrow: "Agent",
        title: "Agent Mission Control",
        description: "A step-by-step visual view of planning, tool selection, execution, and reflection.",
      },
      aiOs: {
        eyebrow: "Agent OS",
        title: "Agent OS Console",
        description: "Real-time console for the AI OS runtime — sessions, run traces, tool chains, knowledge retrieval, and policy enforcement.",
      },
      aiWorkflow: {
        eyebrow: "Workflow",
        title: "Sentient Flow",
        description: "A visual workflow canvas for AI pipelines, orchestration, and execution telemetry.",
      },
      aiKnowledge: {
        eyebrow: "Knowledge",
        title: "Knowledge Base",
        description: "RAG-powered retrieval, semantic context, and evolving indexed project knowledge.",
      },
      aiMcp: {
        eyebrow: "MCP",
        title: "MCP Interface",
        description: "Protocol-driven tools, discoverability, and controlled execution for agents.",
      },
      aiArena: {
        eyebrow: "Arena",
        title: "Model Arena",
        description: "Head-to-head comparisons between GPT and Claude with live metrics and voting.",
      },
      about: {
        eyebrow: "About",
        title: "About This Site",
        description: "Project background, evolution timeline, and the design philosophy behind this AI-native platform.",
      },
      evolution: {
        eyebrow: "Evolution",
        title: "Evolution Log",
        description: "A timeline for knowledge sync, coding DNA refreshes, and future self-evolving capabilities.",
      },
      lab: {
        eyebrow: "Lab",
        title: "Experiment Lab",
        description: "Future-facing experiments like Generative UI, Voice Agent, and multi-agent collaboration.",
      },
      labDetail: {
        eyebrow: "Lab Detail",
        title: "Lab Experiment",
        description: "Dynamic route scaffold for specific experiment pages.",
      },
      admin: {
        eyebrow: "Admin",
        title: "Internal Console",
        description: "Protected internal console for observability, jobs, and evolution management.",
      },
      adminObservability: {
        eyebrow: "Admin",
        title: "Observability",
        description: "LLM runs, tool calls, artifact renders, and session visibility will live here.",
      },
      adminJobs: {
        eyebrow: "Admin",
        title: "Job Runs",
        description: "Worker execution history, schedules, failures, and retry visibility.",
      },
      adminEvolution: {
        eyebrow: "Admin",
        title: "Evolution Admin",
        description: "Internal controls and inspection for sync status, growth logs, and generated digests.",
      },
    },
  },
};

export type PlaceholderPageKey = keyof SiteCopy["pages"];

export const siteCopy = siteCopyByLocale[defaultLocale];

export function getSiteCopy(locale: SiteLocale) {
  return siteCopyByLocale[locale];
}
