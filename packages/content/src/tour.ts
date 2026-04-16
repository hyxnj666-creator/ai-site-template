import { defaultLocale, type LocalizedValue, type SiteLocale } from "./locales";

export interface GuidedTourStep {
  description: string;
  id:
    | "hero"
    | "capabilities"
    | "coding-dna"
    | "evolution-pulse"
    | "explore"
    | "portals";
  targetId: string;
  title: string;
}

export interface GuidedTourContent {
  floating: {
    label: string;
    title: string;
  };
  revisit: {
    continueLabel: string;
    description: string;
    exploreLabel: string;
    eyebrow: string;
    restartLabel: string;
    title: string;
  };
  steps: GuidedTourStep[];
  tour: {
    closeLabel: string;
    doneLabel: string;
    eyebrow: string;
    nextLabel: string;
    previousLabel: string;
    progressLabel: string;
    skipLabel: string;
  };
  welcome: {
    description: string;
    exploreLabel: string;
    eyebrow: string;
    title: string;
    tourLabel: string;
  };
}

export const guidedTourContentByLocale: LocalizedValue<GuidedTourContent> = {
  zh: {
    floating: {
      label: "AI",
      title: "唤起 AI Guide",
    },
    revisit: {
      continueLabel: "继续 Tour",
      description: "上次你停在了the previous step。要不要从那里继续？",
      exploreLabel: "我先自己逛",
      eyebrow: "Welcome Back",
      restartLabel: "从头再来",
      title: "AI 助手 还记得你的上次探索",
    },
    steps: [
      {
        description:
          "这里是整个站点的叙事入口。第一屏负责定义气质与方向，让访客一眼感受到这不是简历页，而是一套会进化的 AI 原生界面。",
        id: "hero",
        targetId: "hero",
        title: "先看 Hero 与 AI 入口",
      },
      {
        description:
          "这块是不对称 Bento Grid，用来展示 Agent、Workflow、Knowledge、MCP、Arena 和 AI UI Runtime 这些核心能力模块。",
        id: "capabilities",
        targetId: "capabilities",
        title: "再看能力矩阵",
      },
      {
        description:
          "Coding DNA 不是装饰，它用工程语言解释我为什么要用 monorepo、typed content、worker 和 observability 这套地基。",
        id: "coding-dna",
        targetId: "coding-dna",
        title: "然后看 Coding DNA",
      },
      {
        description:
          "Evolution Pulse 用来承接“自动进化”的故事线。后面知识同步、Jobs、周报和能力升级都会在这里有真实反馈。",
        id: "evolution-pulse",
        targetId: "evolution-pulse",
        title: "看进化脉冲",
      },
      {
        description:
          "Explore with AI 是交互层入口，Command Palette、Chat、终端感界面和未来的 AI Artifacts 都会围绕这里继续扩展。",
        id: "explore",
        targetId: "explore",
        title: "最后看 AI 交互入口",
      },
      {
        description:
          "Resume、Blog 和 GitHub 仍然是独立入口。主站负责做更聪明的导航层，把人带到最合适的上下文。",
        id: "portals",
        targetId: "portals",
        title: "收尾看外部入口",
      },
    ],
    tour: {
      closeLabel: "关闭",
      doneLabel: "完成",
      eyebrow: "AI-Guided Tour",
      nextLabel: "下一步",
      previousLabel: "上一步",
      progressLabel: "步骤",
      skipLabel: "先到这里",
    },
    welcome: {
      description:
        "如果你是第一次来，我可以像私人导游一样，在 1 分钟内带你看完这个站点最值得注意的部分。",
      exploreLabel: "我先自己看看",
      eyebrow: "Welcome",
      title: "你好，欢迎来到我的宇宙。我是 AI 助手。",
      tourLabel: "带我逛逛",
    },
  },
  en: {
    floating: {
      label: "AI",
      title: "Open AI guide",
    },
    revisit: {
      continueLabel: "Continue tour",
      description:
        "Last time you stopped around the previous step. Want to pick up from there?",
      exploreLabel: "I'll explore on my own",
      eyebrow: "Welcome Back",
      restartLabel: "Restart tour",
      title: "Your AI assistant remembers your last exploration",
    },
    steps: [
      {
        description:
          "This is the narrative entry to the whole site. The first screen establishes that this is not a resume page, but a living AI-native interface with its own atmosphere.",
        id: "hero",
        targetId: "hero",
        title: "Start with the hero and AI entry point",
      },
      {
        description:
          "This asymmetrical bento grid frames the core capabilities: Agent, Workflow, Knowledge, MCP, Arena, and the AI UI Runtime.",
        id: "capabilities",
        targetId: "capabilities",
        title: "Move into the capabilities grid",
      },
      {
        description:
          "Coding DNA is not just decoration. It explains the engineering rationale behind the monorepo, typed content, worker separation, and observability foundation.",
        id: "coding-dna",
        targetId: "coding-dna",
        title: "Read the Coding DNA layer",
      },
      {
        description:
          "Evolution Pulse carries the self-evolving story. Later, knowledge sync, jobs, weekly digests, and capability upgrades will surface here as real events.",
        id: "evolution-pulse",
        targetId: "evolution-pulse",
        title: "Check the evolution pulse",
      },
      {
        description:
          "Explore with AI is the interaction gateway. Command Palette, Chat, terminal-like interfaces, and future AI artifacts will keep growing from this section.",
        id: "explore",
        targetId: "explore",
        title: "See the AI interaction layer",
      },
      {
        description:
          "Resume, Blog, and GitHub remain independent portals. The main site becomes the smarter layer that routes visitors into the right context.",
        id: "portals",
        targetId: "portals",
        title: "Finish with the external portals",
      },
    ],
    tour: {
      closeLabel: "Close",
      doneLabel: "Finish",
      eyebrow: "AI-Guided Tour",
      nextLabel: "Next",
      previousLabel: "Back",
      progressLabel: "Step",
      skipLabel: "Pause here",
    },
    welcome: {
      description:
        "If this is your first time here, I can guide you through the most important parts of the site in about a minute, like a private AI host.",
      exploreLabel: "I'll explore on my own",
      eyebrow: "Welcome",
      title: "Hi, welcome to my universe. I'm Your AI assistant.",
      tourLabel: "Give me a tour",
    },
  },
};

export const guidedTourContent = guidedTourContentByLocale[defaultLocale];

export function getGuidedTourContent(locale: SiteLocale) {
  return guidedTourContentByLocale[locale];
}
