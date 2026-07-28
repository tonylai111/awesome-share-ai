import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getGuides, pickLocalized } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tMeta = useTranslations("meta");
  const guides = getGuides().slice(0, 5);

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <div className="footer-avatar" aria-hidden>
            T
          </div>
          <div>
            <div className="footer-name">{tMeta("siteName")}</div>
            <p className="footer-tagline">{t("tagline")}</p>
          </div>
        </div>

        <div className="footer-col">
          <h3>{t("nav")}</h3>
          <ul>
            <li>
              <Link href="/about">{tNav("about")}</Link>
            </li>
            <li>
              <Link href="/works">{tNav("works")}</Link>
            </li>
            <li>
              <Link href="/articles">{tNav("articles")}</Link>
            </li>
            <li>
              <Link href="/guides">{tNav("guides")}</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>{t("guides")}</h3>
          <ul>
            {guides.map((g) => (
              <li key={g.meta.slug}>
                <Link href={`/guides/${g.meta.slug}`}>
                  {pickLocalized(g.meta.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3>{t("contact")}</h3>
          <ul>
            <li>{t("wechat")}</li>
            <li>{t("location")}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
