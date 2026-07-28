import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { LocalizedString } from "@/lib/i18n-content";
import type { ArticleMeta, ContentDoc, GuideMeta } from "@/lib/types";

export type { ArticleMeta, ContentDoc, GuideMeta, LocalizedString };
export { pickLocalized, formatDate } from "@/lib/i18n-content";

const contentRoot = path.join(process.cwd(), "content");

function parseLocalizedBody(raw: string): LocalizedString {
  const zhMatch = raw.match(/<<<zh>>>\s*([\s\S]*?)(?=<<<(?:en|zh)>>>|$)/);
  const enMatch = raw.match(/<<<en>>>\s*([\s\S]*?)(?=<<<(?:en|zh)>>>|$)/);

  if (zhMatch || enMatch) {
    return {
      zh: (zhMatch?.[1] ?? "").trim(),
      en: (enMatch?.[1] ?? zhMatch?.[1] ?? "").trim(),
    };
  }

  const trimmed = raw.trim();
  return { zh: trimmed, en: trimmed };
}

function readCollection<T extends { slug: string }>(
  dir: string,
  mapMeta: (data: Record<string, unknown>, slug: string) => T,
): ContentDoc<T>[] {
  const fullDir = path.join(contentRoot, dir);
  if (!fs.existsSync(fullDir)) return [];

  return fs
    .readdirSync(fullDir)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(fullDir, file), "utf8");
      const { data, content } = matter(raw);
      return {
        meta: mapMeta(data as Record<string, unknown>, slug),
        body: parseLocalizedBody(content),
      };
    })
    .sort((a, b) => {
      const dateA =
        "date" in a.meta ? String((a.meta as { date: string }).date) : "";
      const dateB =
        "date" in b.meta ? String((b.meta as { date: string }).date) : "";
      return dateB.localeCompare(dateA);
    });
}

function asLocalized(value: unknown, fallback = ""): LocalizedString {
  if (typeof value === "string") return { zh: value, en: value };
  if (value && typeof value === "object") {
    const obj = value as Record<string, string>;
    return {
      zh: obj.zh ?? fallback,
      en: obj.en ?? obj.zh ?? fallback,
    };
  }
  return { zh: fallback, en: fallback };
}

export function getArticles(): ContentDoc<ArticleMeta>[] {
  return readCollection("articles", (data, slug) => ({
    slug,
    title: asLocalized(data.title),
    description: asLocalized(data.description),
    date: String(data.date ?? ""),
    tags: (data.tags as string[]) ?? [],
    category: (data.category as ArticleMeta["category"]) ?? "ai",
    readingMinutes: Number(data.readingMinutes ?? 5),
  }));
}

export function getGuides(): ContentDoc<GuideMeta>[] {
  return readCollection("guides", (data, slug) => ({
    slug,
    title: asLocalized(data.title),
    description: asLocalized(data.description),
    date: String(data.date ?? ""),
    tags: (data.tags as string[]) ?? [],
    readingMinutes: Number(data.readingMinutes ?? 10),
    theme: String(data.theme ?? "default"),
    prompt: String(data.prompt ?? "tony@cli:~$"),
    accent: String(data.accent ?? "#C45C26"),
    displayName: String(data.displayName ?? slug.toUpperCase()),
    icon: (data.icon as GuideMeta["icon"]) ?? "agent",
    cta: data.cta ? String(data.cta) : undefined,
  }));
}

export function getArticle(slug: string): ContentDoc<ArticleMeta> | undefined {
  return getArticles().find((doc) => doc.meta.slug === slug);
}

export function getGuide(slug: string): ContentDoc<GuideMeta> | undefined {
  return getGuides().find((doc) => doc.meta.slug === slug);
}
