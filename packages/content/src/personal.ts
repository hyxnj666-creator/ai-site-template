import { defaultLocale, type LocalizedValue, type SiteLocale } from "./locales";
import { personalProfileSchema } from "./schemas";

export const personalProfiles: LocalizedValue<
  ReturnType<typeof personalProfileSchema.parse>
> = {
  zh: personalProfileSchema.parse({
    name: "Alex Chen",
    title: "AI 全栈工程师",
    summary:
      "构建融合工程基础、设计审美、交互细节和 AI 能力的 AI 原生产品。",
  }),
  en: personalProfileSchema.parse({
    name: "Alex Chen",
    title: "AI Full-Stack Engineer",
    summary:
      "Building AI-native products that combine strong engineering foundations, design taste, and interaction craftsmanship.",
  }),
};

export const personalProfile = personalProfiles[defaultLocale];

export function getPersonalProfile(locale: SiteLocale) {
  return personalProfiles[locale];
}
