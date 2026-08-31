import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhotoBanner } from "@/components/PhotoBanner";

const projects: {
  id: "awesomeShareAi" | "agentCards" | "youtubeDigest";
  href: string;
}[] = [
  {
    id: "awesomeShareAi",
    href: "https://awesome-share-ai.vercel.app/zh/about",
  },
  {
    id: "agentCards",
    href: "https://tonylai111.github.io/agent-cards/#cards",
  },
  {
    id: "youtubeDigest",
    href: "https://github.com/tonylai111/youtube-digest",
  },
];

const serviceIds = ["agent", "content", "explain"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <section className="about-page">
      <div className="about-hero">
        <img className="about-avatar" src="/avatar.png" alt="" />
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="about-tagline">{t("tagline")}</p>
        </div>
      </div>

      <PhotoBanner label={t("bannerLabel")} />

      <div className="prose-body about-prose">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
      </div>

      <section className="about-section" aria-labelledby="about-services">
        <h2 id="about-services" className="about-section-title">
          {t("servicesTitle")}
        </h2>
        <p className="about-section-sub">{t("servicesSubtitle")}</p>
        <ul className="about-services">
          {serviceIds.map((id) => (
            <li key={id} className="about-service-item">
              <h3>{t(`services.items.${id}.title`)}</h3>
              <p className="about-service-problem">
                {t(`services.items.${id}.problem`)}
              </p>
              <p className="about-service-offer">
                {t(`services.items.${id}.offer`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section" aria-labelledby="about-works">
        <h2 id="about-works" className="about-section-title">
          {t("worksTitle")}
        </h2>
        <p className="about-section-sub">{t("worksSubtitle")}</p>
        <ul className="about-works">
          {projects.map((project) => (
            <li key={project.id}>
              <a
                className="about-work-card"
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3>{t(`works.items.${project.id}.title`)}</h3>
                <p>{t(`works.items.${project.id}.description`)}</p>
                <span className="about-work-cta">{t("worksVisit")} ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section" aria-labelledby="about-contact">
        <h2 id="about-contact" className="about-section-title">
          {t("contactTitle")}
        </h2>
        <ul className="about-contact">
          <li className="about-contact-item">
            <span className="label">{t("contact.wechat.label")}</span>
            <strong>{t("contact.wechat.value")}</strong>
            <em>{t("contact.wechat.note")}</em>
          </li>
          <li className="about-contact-item">
            <span className="label">{t("contact.email.label")}</span>
            <a href={t("contact.email.href")}>{t("contact.email.value")}</a>
          </li>
          <li className="about-contact-item">
            <span className="label">{t("contact.github.label")}</span>
            <a
              href={t("contact.github.href")}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("contact.github.value")}
            </a>
          </li>
        </ul>
      </section>
    </section>
  );
}
