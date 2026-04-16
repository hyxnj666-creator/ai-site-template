import type { MetadataRoute } from "next";

const SITE_URL = "https://yoursite.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/evolution", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/ai", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/ai/chat", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/ai/agent", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ai/knowledge", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/mcp", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/workflow", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/arena", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai/os", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/lab", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  return staticPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
