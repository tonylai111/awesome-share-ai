import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArticleList } from "@/components/ArticleList";
import { getArticles } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "articles" });
  return { title: t("title") };
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("articles");
  const articles = getArticles().map((doc) => doc.meta);

  return (
    <section className="page-wide">
      <div className="breadcrumb">
        <Link href="/">{t("breadcrumbHome")}</Link>
        {" / "}
        <span>{t("breadcrumb")}</span>
      </div>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-subtitle">{t("subtitle")}</p>
      <ArticleList
        articles={articles}
        locale={locale as Locale}
        labels={{
          all: t("all"),
          categories: {
            ai: t("categories.ai"),
            quant: t("categories.quant"),
            notes: t("categories.notes"),
          },
          empty: t("empty"),
        }}
      />
    </section>
  );
}
