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

export type FictionChapterMeta = {
  slug: string;
  /** 阅读顺序（1 起） */
  order: number;
  /** 显示用章节号，如 "01" / "间章一" */
  label: string;
  /** main = 主线，interval = 间章 */
  kind: "main" | "interval";
  /** 叙述视角人物 */
  pov: string;
  title: LocalizedString;
  description: LocalizedString;
  date: string;
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
