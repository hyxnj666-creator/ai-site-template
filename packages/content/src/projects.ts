import { projectSchema } from './schemas';

export const projects = [
  projectSchema.parse({
    slug: 'ai-chat-platform',
    title: 'AI Chat Platform',
    summary: 'An AI-powered chat application with streaming, tool use, and multi-model support.',
    tags: ['ai', 'nextjs', 'streaming'],
  }),
  projectSchema.parse({
    slug: 'portfolio-site',
    title: 'Portfolio Site',
    summary: 'Personal portfolio with AI-driven features, guided tours, and a living interface.',
    tags: ['nextjs', 'ai', 'design-system'],
  }),
  projectSchema.parse({
    slug: 'open-source-toolkit',
    title: 'Open Source Toolkit',
    summary: 'Developer tools and utilities for building AI-native applications.',
    tags: ['typescript', 'tooling', 'open-source'],
  }),
];
