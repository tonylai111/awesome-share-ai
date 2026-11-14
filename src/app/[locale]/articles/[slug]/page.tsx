import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { GuideToc } from "@/components/GuideToc";
import { MdxContent } from "@/components/MdxContent";
import { ScrollJump } from "@/components/ScrollJump";
import { ShareButton } from "@/components/ShareButton";
import { SubscribeWidget } from "@/components/SubscribeWidget";
import {
  formatDate,
  getArticle,
  getArticleNeighbors,
  getArticles,
  getRelatedArticles,
  pickLocalized,
} from "@/lib/content";
import { countWords, formatWordCount } from "@/lib/stats";
import { extractToc } from "@/lib/toc";
import type { ArticleMeta } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

const TOC_MIN_ITEMS = 3;

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
  const tGuides = await getTranslations("guides");
  const tScroll = await getTranslations("scroll");
  const loc = locale as Locale;
  const body = pickLocalized(article.body, loc);
  const words = countWords(body);
  const toc = extractToc(body);
  const showToc = toc.length >= TOC_MIN_ITEMS;
  const { prev, next } = getArticleNeighbors(slug);
  const related = getRelatedArticles(slug);
  const title = pickLocalized(article.meta.title, loc);
  const category = t(`categories.${article.meta.category}`);

  return (
    <div className="article-shell">
      <div className={showToc ? "article-layout" : "article-layout is-solo"}>
      {showToc ? (
        <GuideToc
          items={toc}
          collapseBelow={1080}
          labels={{
            tree: tGuides("tree"),
            hide: tGuides("hide"),
            show: tGuides("show"),
            search: tGuides("search"),
            searchPlaceholder: tGuides("searchPlaceholder"),
            noResults: tGuides("noResults"),
            nav: tGuides("nav"),
          }}
        />
      ) : null}

      <article className="article-main">
        <header className="article-head">
          <div className="breadcrumb">
            <Link href="/">{t("breadcrumbHome")}</Link>
            {" / "}
            <Link href="/articles">{t("breadcrumb")}</Link>
          </div>
          <p className="article-category">{category}</p>
          <h1 className="page-title article-title">
            <span className="article-title-mark" aria-hidden="true" />
            {title}
          </h1>
          <div className="article-detail-meta">
            <div className="article-meta-facts">
              <time dateTime={article.meta.date}>
                {formatDate(article.meta.date, loc)}
              </time>
              <span>{t("minRead", { minutes: article.meta.readingMinutes })}</span>
              <span>{t("wordCount", { count: formatWordCount(words, loc) })}</span>
            </div>
            <ShareButton
              title={title}
              label={t("share")}
              copiedLabel={t("copied")}
            />
          </div>
        </header>

        <MdxContent source={body} className="mdx-body article-body" />

        <ArticlePager
          currentDate={article.meta.date}
          prev={prev}
          next={next}
          locale={loc}
          newerLabel={t("newer")}
          olderLabel={t("older")}
          sameDayLabel={t("sameDay")}
          label={t("pagerLabel")}
        />

        {related.length > 0 ? (
          <section className="article-related" aria-labelledby="article-related-title">
            <h2 id="article-related-title" className="article-related-title">
              {t("related")}
            </h2>
            <ul>
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/articles/${item.slug}`}>
                    <span className="article-related-name">
                      {pickLocalized(item.title, loc)}
                    </span>
                    <span className="article-related-desc">
                      {pickLocalized(item.description, loc)}
                    </span>
                    <span className="article-related-meta">
                      <time dateTime={item.date}>{formatDate(item.date, loc)}</time>
                      <span>{t("minRead", { minutes: item.readingMinutes })}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="page-widgets">
          <FeedbackWidget />
          <SubscribeWidget />
        </div>
      </article>
      </div>
      <ScrollJump toBottom={tScroll("toBottom")} toTop={tScroll("toTop")} />
    </div>
  );
}

function neighborLabel(
  currentDate: string,
  otherDate: string,
  newerLabel: string,
  olderLabel: string,
  sameDayLabel: string,
) {
  if (otherDate > currentDate) return newerLabel;
  if (otherDate < currentDate) return olderLabel;
  return sameDayLabel;
}

function ArticlePager({
  currentDate,
  prev,
  next,
  locale,
  newerLabel,
  olderLabel,
  sameDayLabel,
  label,
}: {
  currentDate: string;
  prev?: ArticleMeta;
  next?: ArticleMeta;
  locale: Locale;
  newerLabel: string;
  olderLabel: string;
  sameDayLabel: string;
  label: string;
}) {
  if (!prev && !next) return null;

  return (
    <nav className="article-pager" aria-label={label}>
      {prev ? (
        <Link href={`/articles/${prev.slug}`} className="article-pager-link">
          <span className="article-pager-dir">
            {neighborLabel(
              currentDate,
              prev.date,
              newerLabel,
              olderLabel,
              sameDayLabel,
            )}
          </span>
          <span className="article-pager-name">
            {pickLocalized(prev.title, locale)}
          </span>
        </Link>
      ) : null}
      {next ? (
        <Link
          href={`/articles/${next.slug}`}
          className="article-pager-link is-older"
        >
          <span className="article-pager-dir">
            {neighborLabel(
              currentDate,
              next.date,
              newerLabel,
              olderLabel,
              sameDayLabel,
            )}
          </span>
          <span className="article-pager-name">
            {pickLocalized(next.title, locale)}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
