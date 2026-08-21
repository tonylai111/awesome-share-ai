import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { MdxContent } from "@/components/MdxContent";
import { ScrollJump } from "@/components/ScrollJump";
import { SubscribeWidget } from "@/components/SubscribeWidget";
import {
  formatDate,
  getArticle,
  getArticles,
  pickLocalized,
} from "@/lib/content";
import { countWords, formatWordCount } from "@/lib/stats";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  const articles = getArticles();
  return routing.locales.flatMap((locale) =>
    articles.map((article) => ({ locale, slug: article.meta.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: pickLocalized(article.meta.title, locale as Locale),
    description: pickLocalized(article.meta.description, locale as Locale),
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const article = getArticle(slug);
  if (!article) notFound();

  const t = await getTranslations("articles");
  const tScroll = await getTranslations("scroll");
  const loc = locale as Locale;
  const body = pickLocalized(article.body, loc);
  const words = countWords(body);

  return (
    <article className="page-narrow">
      <div className="breadcrumb">
        <Link href="/">{t("breadcrumbHome")}</Link>
        {" / "}
        <Link href="/articles">{t("breadcrumb")}</Link>
      </div>
      <h1 className="page-title">
        {pickLocalized(article.meta.title, loc)}
      </h1>
      <div className="article-detail-meta">
        <time dateTime={article.meta.date}>
          {formatDate(article.meta.date, loc)}
        </time>
        <span>
          {t("minRead", { minutes: article.meta.readingMinutes })}
        </span>
        <span>
          {t("wordCount", {
            count: formatWordCount(words, loc),
          })}
        </span>
      </div>
      <MdxContent source={body} className="mdx-body" />
      <div className="page-widgets">
        <FeedbackWidget />
        <SubscribeWidget />
      </div>
      <ScrollJump
        toBottom={tScroll("toBottom")}
        toTop={tScroll("toTop")}
      />
    </article>
  );
}
