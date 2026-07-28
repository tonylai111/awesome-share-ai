import { Link } from "@/i18n/navigation";
import type { GuideMeta } from "@/lib/types";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";
import { GuideIcon } from "./GuideIcon";

type Props = {
  guide: GuideMeta;
  locale: Locale;
  ctaLabel: string;
};

export function GuideCard({ guide, locale, ctaLabel }: Props) {
  const title = pickLocalized(guide.title, locale);
  const description = pickLocalized(guide.description, locale);

  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="guide-card"
      style={{ ["--guide-accent" as string]: guide.accent }}
    >
      <div className="guide-card-chrome">
        <div className="traffic-lights" aria-hidden>
          <span style={{ background: guide.accent }} />
          <span style={{ background: soft(guide.accent, 0.75) }} />
          <span style={{ background: soft(guide.accent, 0.5) }} />
        </div>
        <span className="guide-prompt">{guide.prompt}</span>
        <span className="guide-display font-pixel">{guide.displayName}</span>
        <span className="guide-icon-wrap">
          <GuideIcon name={guide.icon} accent={guide.accent} />
        </span>
      </div>
      <div className="guide-card-body">
        <h2>{title}</h2>
        <p>{description}</p>
        <span className="guide-cta">{guide.cta ?? ctaLabel}</span>
      </div>
    </Link>
  );
}

function soft(hex: string, opacity: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
