import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const projects = [
  {
    id: "agentCards" as const,
    href: "https://tonylai111.github.io/agent-cards/#cards",
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
            <a
              href={project.href}
              className="work-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2>{t(`items.${project.id}.title`)}</h2>
              <p>{t(`items.${project.id}.description`)}</p>
              <span className="work-cta">{t("visit")}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
