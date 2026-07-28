import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GuideToc } from "@/components/GuideToc";
import { MdxContent } from "@/components/MdxContent";
import { ScrollJump } from "@/components/ScrollJump";
import {
  formatDate,
  getGuide,
  getGuides,
  pickLocalized,
} from "@/lib/content";
import { countWords, formatWordCount } from "@/lib/stats";
import { extractToc } from "@/lib/toc";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  const guides = getGuides();
  return routing.locales.flatMap((locale) =>
    guides.map((guide) => ({ locale, slug: guide.meta.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: pickLocalized(guide.meta.title, locale as Locale),
    description: pickLocalized(guide.meta.description, locale as Locale),
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const guide = getGuide(slug);
  if (!guide) notFound();

  const t = await getTranslations("guides");
  const tArticles = await getTranslations("articles");
  const loc = locale as Locale;
  const body = pickLocalized(guide.body, loc);
  const toc = extractToc(body);
  const words = countWords(body);

  return (
    <div className="guide-paper">
      <div className="guide-paper-layout">
        <GuideToc
          items={toc}
          labels={{
            tree: t("tree"),
            hide: t("hide"),
            show: t("show"),
            search: t("search"),
            searchPlaceholder: t("searchPlaceholder"),
            noResults: t("noResults"),
            nav: t("nav"),
          }}
        />
        <article className="guide-content">
          <div className="breadcrumb">
            <Link href="/guides">{t("title")}</Link>
          </div>
          <h1 className="page-title">
            {pickLocalized(guide.meta.title, loc)}
          </h1>
          <div className="article-detail-meta">
            <time dateTime={guide.meta.date}>
              {formatDate(guide.meta.date, loc)}
            </time>
            <span>
              {tArticles("minRead", { minutes: guide.meta.readingMinutes })}
            </span>
            <span>
              {tArticles("wordCount", {
                count: formatWordCount(words, loc),
              })}
            </span>
          </div>
          <MdxContent source={body} className="mdx-body guide-mdx" />
        </article>
      </div>
      <ScrollJump toBottom={t("toBottom")} toTop={t("toTop")} />
    </div>
  );
}
