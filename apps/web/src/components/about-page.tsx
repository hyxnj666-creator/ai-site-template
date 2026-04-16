"use client";

import Link from "next/link";
import { type LocalizedValue, siteLinks } from "@ai-site/content";
import { GlassPanel, SignalBar, buttonClassName } from "@ai-site/ui";
import { useLocalizedValue } from "./locale-provider";
import { useInView } from "@/hooks/use-in-view";

const aboutContentByLocale: LocalizedValue<{
  eyebrow: string;
  title: string;
  subtitle: string;
  bio: string[];
  philosophyTitle: string;
  philosophyItems: Array<{ label: string; text: string }>;
  stackTitle: string;
  stack: Array<{ name: string; level: number; color: string }>;
  siteTitle: string;
  siteDescription: string;
  sites: Array<{ label: string; href: string; description: string }>;
  connectTitle: string;
  connectItems: Array<{ label: string; href: string }>;
}> = {
  zh: {
    eyebrow: "关于",
    title: "关于我",
    subtitle: "AI 全栈工程师 · 构建融合工程、设计与 AI 能力的产品",
    bio: [
      "我是一名专注于 AI 产品工程的全栈开发者。过去几年从前端到全栈，再到 AI 全栈的技术路径让我形成了一个核心信念：好的 AI 产品不是\u201C把模型接进页面\u201D，而是从底层架构到用户体验的整体思考。",
      "这个网站本身就是这种理念的实践。它不是静态展示站，而是一个 AI 原生的活体平台——从 Agent 对话、知识检索、工作流编排到模型竞技场，每一个模块都在展示真实的 AI 工程能力，每一行代码都服务于最终的产品体验。",
      "技术栈上，我深度使用 TypeScript / React / Next.js 作为工程基座，配合 AI SDK、RAG、MCP、pgvector 等 AI 基础设施，形成从模型调用到用户界面的全链路闭环。设计层面，我追求 Awwwards 级别的电影感 UI，而不是千篇一律的 SaaS 模板。",
    ],
    philosophyTitle: "工程理念",
    philosophyItems: [
      { label: "类型驱动", text: "TypeScript strict + Zod schema 覆盖从 API 到 UI 的全链路类型安全" },
      { label: "AI 原生", text: "AI 不是附加功能，而是产品核心——从内容层、Agent 系统到可观测性都围绕 AI 设计" },
      { label: "设计即工程", text: "Design Tokens → Primitives → Composites 三层设计系统，确保视觉一致性和可扩展性" },
      { label: "进化架构", text: "Monorepo + Worker + DB Repo 分层，支持系统自进化而不失控" },
    ],
    stackTitle: "核心技术栈",
    stack: [
      { name: "TypeScript", level: 95, color: "#3178c6" },
      { name: "React / Next.js", level: 92, color: "#61dafb" },
      { name: "AI SDK / Agent", level: 88, color: "#d0bcff" },
      { name: "Node.js", level: 85, color: "#68a063" },
      { name: "PostgreSQL / pgvector", level: 78, color: "#336791" },
      { name: "Tailwind / Design System", level: 90, color: "#38bdf8" },
    ],
    siteTitle: "站点矩阵",
    siteDescription: "三站协同，共享品牌视觉体系",
    sites: [
      { label: "个人主站", href: "/", description: "AI 能力展示 + 交互平台（本站）" },
      { label: "在线简历", href: siteLinks.resume, description: "精简的个人简历展示" },
      { label: "技术博客", href: siteLinks.blog, description: "技术文章与实践输出" },
    ],
    connectTitle: "联系方式",
    connectItems: [
      { label: "GitHub", href: siteLinks.github },
      { label: "简历", href: siteLinks.resume },
      { label: "博客", href: siteLinks.blog },
    ],
  },
  en: {
    eyebrow: "About",
    title: "About Me",
    subtitle: "AI Full-Stack Engineer · Building products that fuse engineering, design & AI",
    bio: [
      "I'm a full-stack developer focused on AI product engineering. My journey from frontend to full-stack to AI full-stack has shaped a core belief: great AI products aren't about \"plugging a model into a page\" — they require holistic thinking from architecture to user experience.",
      "This website itself is a practice of that philosophy. It's not a static portfolio — it's an AI-native living platform. From Agent conversations, knowledge retrieval, workflow orchestration to model arena, every module demonstrates real AI engineering capability, and every line of code serves the final product experience.",
      "On the tech stack side, I work deeply with TypeScript / React / Next.js as the engineering foundation, combined with AI SDK, RAG, MCP, pgvector and other AI infrastructure to form a full pipeline from model invocation to user interface. On the design side, I aim for Awwwards-level cinematic UI, not cookie-cutter SaaS templates.",
    ],
    philosophyTitle: "Engineering Philosophy",
    philosophyItems: [
      { label: "Type-Driven", text: "TypeScript strict + Zod schemas covering full-chain type safety from API to UI" },
      { label: "AI-Native", text: "AI is the product core, not an add-on — content layer, Agent system, and observability all designed around AI" },
      { label: "Design = Engineering", text: "Design Tokens → Primitives → Composites three-layer system ensures visual consistency and extensibility" },
      { label: "Evolutionary Architecture", text: "Monorepo + Worker + DB Repo layering supports system self-evolution without losing control" },
    ],
    stackTitle: "Core Tech Stack",
    stack: [
      { name: "TypeScript", level: 95, color: "#3178c6" },
      { name: "React / Next.js", level: 92, color: "#61dafb" },
      { name: "AI SDK / Agent", level: 88, color: "#d0bcff" },
      { name: "Node.js", level: 85, color: "#68a063" },
      { name: "PostgreSQL / pgvector", level: 78, color: "#336791" },
      { name: "Tailwind / Design System", level: 90, color: "#38bdf8" },
    ],
    siteTitle: "Site Matrix",
    siteDescription: "Three sites in sync, sharing a unified brand visual system",
    sites: [
      { label: "Main Site", href: "/", description: "AI capability showcase + interactive platform (this site)" },
      { label: "Resume", href: siteLinks.resume, description: "Streamlined personal resume" },
      { label: "Blog", href: siteLinks.blog, description: "Technical articles & practice output" },
    ],
    connectTitle: "Connect",
    connectItems: [
      { label: "GitHub", href: siteLinks.github },
      { label: "Resume", href: siteLinks.resume },
      { label: "Blog", href: siteLinks.blog },
    ],
  },
};

export function AboutPage() {
  const content = useLocalizedValue(aboutContentByLocale);
  const { ref: bioRef, inView: bioInView } = useInView(0.1);
  const { ref: philRef, inView: philInView } = useInView(0.1);
  const { ref: stackRef, inView: stackInView } = useInView(0.1);
  const { ref: siteRef, inView: siteInView } = useInView(0.1);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[10%] top-28 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[12%] top-44 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-40 left-1/3 h-44 w-44 rounded-full bg-tertiary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-screen-xl px-4 pb-24 pt-36 md:px-8 md:pt-44">
          {/* Header */}
          <div className="mb-20">
            <p className="font-label-ui text-xs uppercase tracking-[0.28em] text-foreground-muted">
              {content.eyebrow}
            </p>
            <h1 className="font-display-ui mt-4 text-5xl font-semibold tracking-[-0.06em] md:text-7xl">
              {content.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-muted md:text-xl">
              {content.subtitle}
            </p>
          </div>

          {/* Bio */}
          <div
            ref={bioRef}
            className={["scroll-reveal max-w-3xl space-y-6 transition-all duration-700", bioInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"].join(" ")}
          >
            {content.bio.map((paragraph, i) => (
              <p
                key={i}
                className="text-base leading-8 text-foreground-muted md:text-lg"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Philosophy */}
          <div ref={philRef} className="scroll-reveal mt-24">
            <h2
              className={["font-display-ui text-3xl font-semibold tracking-[-0.04em] transition-all duration-700 md:text-4xl", philInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
            >
              {content.philosophyTitle}
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {content.philosophyItems.map((item, i) => (
                <GlassPanel
                  key={item.label}
                  className={["rounded-2xl p-6 transition-all duration-700", philInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <p className="font-label-ui text-[11px] uppercase tracking-[0.22em] text-primary">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-foreground-muted">
                    {item.text}
                  </p>
                </GlassPanel>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div ref={stackRef} className="scroll-reveal mt-24">
            <h2
              className={["font-display-ui text-3xl font-semibold tracking-[-0.04em] transition-all duration-700 md:text-4xl", stackInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
            >
              {content.stackTitle}
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {content.stack.map((tech, i) => (
                <div
                  key={tech.name}
                  className={["transition-all duration-700", stackInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <SignalBar
                    accent={i < 2 ? "secondary" : i < 4 ? "primary" : "tertiary"}
                    animate={stackInView}
                    label={tech.name}
                    value={tech.level}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Site Matrix */}
          <div ref={siteRef} className="scroll-reveal mt-24">
            <h2
              className={["font-display-ui text-3xl font-semibold tracking-[-0.04em] transition-all duration-700 md:text-4xl", siteInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"].join(" ")}
            >
              {content.siteTitle}
            </h2>
            <p className="mt-3 text-foreground-muted">{content.siteDescription}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {content.sites.map((site, i) => {
                const isExternal = site.href.startsWith("http");
                const Component = isExternal ? "a" : Link;
                const extraProps = isExternal ? { target: "_blank", rel: "noreferrer" } : {};
                return (
                  <Component
                    key={site.label}
                    href={site.href}
                    className={[
                      "group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-500 hover:border-primary/20 hover:bg-primary/5",
                      siteInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                    ].join(" ")}
                    style={{ transitionDelay: `${i * 80}ms` }}
                    {...extraProps}
                  >
                    <p className="font-display-ui text-lg font-semibold tracking-[-0.02em] group-hover:text-primary transition-colors">
                      {site.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground-muted">
                      {site.description}
                    </p>
                  </Component>
                );
              })}
            </div>
          </div>

          {/* Connect */}
          <div className="mt-24 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-4">
            <h2 className="font-display-ui text-2xl font-semibold tracking-[-0.04em]">
              {content.connectTitle}
            </h2>
            <div className="flex flex-wrap gap-3">
              {content.connectItems.map((item) => (
                <a
                  key={item.label}
                  className={buttonClassName({ variant: "secondary", size: "md" })}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
