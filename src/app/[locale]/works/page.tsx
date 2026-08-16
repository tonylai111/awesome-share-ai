import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const projects: {
  id: "youtubeDigest" | "agentCards";
  href: string;
  download?: string;
  external: boolean;
}[] = [
  {
    id: "youtubeDigest",
    href: "https://github.com/tonylai111/youtube-digest",
    download:
      "https://github.com/tonylai111/youtube-digest/releases/download/v1.22.0/youtube-digest-v1.22.0.zip",
    external: true,
  },
  {
    id: "agentCards",
    href: "https://tonylai111.github.io/agent-cards/#cards",
    external: true,
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "works" });
  return { title: t("title") };
}

export default async function WorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("works");

  return (
    <section className="page-wide">
      <div className="breadcrumb">
        <Link href="/">{t("breadcrumbHome")}</Link>
        {" / "}
        <span>{t("breadcrumb")}</span>
      </div>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-subtitle">{t("subtitle")}</p>

      <ul className="works-list">
        {projects.map((project) => (
          <li key={project.id}>
            <div className="work-card">
              {project.external ? (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h2>{t(`items.${project.id}.title`)}</h2>
                  <p>{t(`items.${project.id}.description`)}</p>
                </a>
              ) : (
                <Link href={project.href}>
                  <h2>{t(`items.${project.id}.title`)}</h2>
                  <p>{t(`items.${project.id}.description`)}</p>
                </Link>
              )}
              <div className="work-actions">
                {project.download ? (
                  <a href={project.download} className="work-cta" download>
                    {t("download")}
                  </a>
                ) : null}
                {project.external ? (
                  <a
                    href={project.href}
                    className="work-cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("visit")}
                  </a>
                ) : (
                  <Link href={project.href} className="work-cta">
                    {t("readGuide")}
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
