import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SubscribeWidget } from "@/components/SubscribeWidget";

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
      <figure className="home-portrait">
        <Image
          src="/avatar.png"
          alt={t("portraitAlt")}
          width={512}
          height={512}
          priority
        />
        <figcaption>
          <span className="home-portrait-name">Tony</span>
          <span className="home-portrait-meta">{t("portraitCaption")}</span>
        </figcaption>
      </figure>
      <div className="page-widgets">
        <SubscribeWidget />
      </div>
    </section>
  );
}
