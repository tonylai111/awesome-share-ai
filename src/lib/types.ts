import type { LocalizedString } from "@/lib/i18n-content";

export type ArticleMeta = {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  date: string;
  tags: string[];
  category: "ai" | "quant" | "notes";
  readingMinutes: number;
};

export type GuideMeta = {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  date: string;
  tags: string[];
  readingMinutes: number;
  theme: string;
  prompt: string;
  accent: string;
  displayName: string;
  icon: "claude" | "agent" | "codex" | "quant";
  cta?: string;
};

export type ContentDoc<T> = {
  meta: T;
  body: LocalizedString;
};
