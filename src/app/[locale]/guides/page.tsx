import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GuideCard } from "@/components/GuideCard";
import { getGuides } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  return { title: t("title") };
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guides");
  const guides = getGuides();

  return (
    <section className="page-wide">
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-subtitle">{t("subtitle")}</p>
      <div className="guides-grid">
        {guides.map((guide) => (
          <GuideCard
            key={guide.meta.slug}
            guide={guide.meta}
            locale={locale as Locale}
            ctaLabel={t("cta")}
          />
        ))}
      </div>
    </section>
  );
}
