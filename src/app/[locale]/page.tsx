import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <section className="home-hero">
      <h1 className="page-title">{t("greeting")}</h1>
      <p className="home-aka">{t("aka")}</p>
      <div className="prose-body">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
      </div>
      <div className="home-actions">
        <Link href="/articles" className="btn btn-primary">
          {t("ctaArticles")}
        </Link>
        <Link href="/guides" className="btn btn-ghost">
          {t("ctaGuides")}
        </Link>
      </div>
      <div className="home-visual" aria-hidden>
        <div className="home-visual-caption">Shenzhen · Run · Build · Agent</div>
      </div>
    </section>
  );
}
