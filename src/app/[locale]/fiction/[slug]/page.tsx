import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MdxContent } from "@/components/MdxContent";
import { ReaderComment } from "@/components/ReaderComment";
import { ScrollJump } from "@/components/ScrollJump";
import {
  getFictionChapter,
  getFictionChapters,
  getFictionNeighbors,
} from "@/lib/content";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getFictionChapters().map((doc) => ({ locale, slug: doc.meta.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const chapter = getFictionChapter(slug);
  if (!chapter) return {};
  return {
    title: pickLocalized(chapter.meta.title, locale as Locale),
    description: pickLocalized(chapter.meta.description, locale as Locale),
  };
}

export default async function FictionChapterPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const chapter = getFictionChapter(slug);
  if (!chapter) notFound();

  const t = await getTranslations("fiction");
  const tScroll = await getTranslations("scroll");
  const loc = locale as Locale;
  const body = pickLocalized(chapter.body, loc);
  const { prev, next } = getFictionNeighbors(slug);

  return (
    <article className="page-narrow">
      <div className="breadcrumb">
        <Link href="/">{t("breadcrumbHome")}</Link>
        {" / "}
        <Link href="/fiction">{t("breadcrumb")}</Link>
      </div>

      <header className="chapter-head">
        <span className="chapter-label">{chapter.meta.label}</span>
        <h1 className="page-title chapter-title-main">
          {pickLocalized(chapter.meta.title, loc)}
        </h1>
        <div className="chapter-meta">
          <span>
            {t("povLabel")} ·{" "}
            <Link href="/fiction#cast" className="chapter-pov-link">
              {chapter.meta.pov}
            </Link>
          </span>
          <span>{t("minRead", { minutes: chapter.meta.readingMinutes })}</span>
        </div>
      </header>

      <MdxContent source={body} className="mdx-body fiction-body" />

      {loc === "en" ? (
        <p className="fiction-translation-note">{t("translationNote")}</p>
      ) : null}

      <nav className="chapter-nav" aria-label={t("chapters")}>
        {prev ? (
          <Link href={`/fiction/${prev.slug}`} className="chapter-nav-link">
            <span className="chapter-nav-dir">{t("prev")}</span>
            <span className="chapter-nav-name">
              {pickLocalized(prev.title, loc)}
            </span>
          </Link>
        ) : (
          <span className="chapter-nav-empty" />
        )}

        <Link href="/fiction" className="chapter-nav-toc">
          {t("toc")}
        </Link>

        {next ? (
          <Link
            href={`/fiction/${next.slug}`}
            className="chapter-nav-link is-next"
          >
            <span className="chapter-nav-dir">{t("next")}</span>
            <span className="chapter-nav-name">
              {pickLocalized(next.title, loc)}
            </span>
          </Link>
        ) : (
          <span className="chapter-nav-empty" />
        )}
      </nav>

      <ReaderComment
        context={`${chapter.meta.label} · ${pickLocalized(chapter.meta.title, loc)}`}
      />

      <ScrollJump toBottom={tScroll("toBottom")} toTop={tScroll("toTop")} />
    </article>
  );
}
