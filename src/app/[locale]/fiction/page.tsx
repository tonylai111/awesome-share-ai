import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ReaderComment } from "@/components/ReaderComment";
import { getFictionChapters } from "@/lib/content";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "fiction" });
  return { title: t("title"), description: t("subtitle") };
}

type CastMember = {
  name: string;
  tag: string;
  body: string;
  chapters: string;
  group: "main" | "interval";
};

type Cast = {
  title: string;
  lead: string;
  mainLabel: string;
  mainNote: string;
  intervalLabel: string;
  intervalNote: string;
  foot: string;
  members: CastMember[];
};

export default async function FictionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fiction");
  const tComment = await getTranslations("readerComment");
  const loc = locale as Locale;
  const chapters = getFictionChapters();
  const intro = t.raw("intro") as string[];
  const cast = t.raw("cast") as Cast;
  const castGroups = [
    {
      variant: "main",
      label: cast.mainLabel,
      note: cast.mainNote,
      members: cast.members.filter((m) => m.group === "main"),
    },
    {
      variant: "interval",
      label: cast.intervalLabel,
      note: cast.intervalNote,
      members: cast.members.filter((m) => m.group === "interval"),
    },
  ];
  const totalMinutes = chapters.reduce(
    (sum, doc) => sum + doc.meta.readingMinutes,
    0,
  );

  return (
    <section className="page-wide">
      <div className="breadcrumb">
        <Link href="/">{t("breadcrumbHome")}</Link>
        {" / "}
        <span>{t("breadcrumb")}</span>
      </div>

      <header className="fiction-hero">
        <p className="fiction-kicker">{t("kicker")}</p>
        <h1 className="page-title fiction-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
        <div className="fiction-facts">
          <span>{t("chaptersCount", { count: chapters.length })}</span>
          <span>{t("totalTime", { minutes: totalMinutes })}</span>
        </div>
      </header>

      <div className="fiction-intro">
        {intro.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <section className="fiction-cast" id="cast">
        <h2 className="fiction-section-title">{cast.title}</h2>
        <p className="fiction-cast-lead">{cast.lead}</p>

        {castGroups.map((group) => (
          <div
            className={`cast-group is-${group.variant}`}
            key={group.label}
          >
            <div className="cast-group-head">
              <span className="cast-group-label">{group.label}</span>
              <span className="cast-group-note">{group.note}</span>
            </div>
            <ul className="cast-list">
              {group.members.map((member) => (
                <li
                  key={member.name}
                  className={
                    member.group === "interval"
                      ? "cast-card is-interval"
                      : "cast-card"
                  }
                >
                  <div className="cast-head">
                    <span className="cast-name">{member.name}</span>
                    <span className="cast-tag">{member.tag}</span>
                  </div>
                  <p className="cast-body">{member.body}</p>
                  <span className="cast-chapters">{member.chapters}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="fiction-cast-foot">{cast.foot}</p>
      </section>

      <h2 className="fiction-section-title">{t("chapters")}</h2>
      <ol className="chapter-list">
        {chapters.map((doc) => {
          const { meta } = doc;
          const isInterval = meta.kind === "interval";
          return (
            <li key={meta.slug}>
              <Link
                href={`/fiction/${meta.slug}`}
                className={
                  isInterval ? "chapter-item is-interval" : "chapter-item"
                }
              >
                <span className="chapter-no">{meta.label}</span>
                <span className="chapter-text">
                  <span className="chapter-name">
                    {pickLocalized(meta.title, loc)}
                  </span>
                  <span className="chapter-desc">
                    {pickLocalized(meta.description, loc)}
                  </span>
                </span>
                <span className="chapter-time">
                  {t("minRead", { minutes: meta.readingMinutes })}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <ReaderComment context={`${t("title")} · ${tComment("allContext")}`} />

      <p className="fiction-disclaimer">{t("disclaimer")}</p>
    </section>
  );
}
