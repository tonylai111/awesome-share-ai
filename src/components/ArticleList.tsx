"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ArticleMeta } from "@/lib/types";
import { formatDate, pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";

const TICKS = 7;

type Props = {
  articles: ArticleMeta[];
  locale: Locale;
  labels: {
    categories: Record<string, string>;
    empty: string;
  };
};

function ReadTicks({ minutes, max }: { minutes: number; max: number }) {
  const filled = Math.max(
    1,
    Math.min(TICKS, Math.round((minutes / max) * TICKS)),
  );

  return (
    <span className="read-ticks" aria-hidden="true">
      {Array.from({ length: TICKS }, (_, index) => (
        <i key={index} className={index < filled ? "is-on" : undefined} />
      ))}
    </span>
  );
}

export function ArticleList({ articles, locale, labels }: Props) {
  const t = useTranslations("articles");

  const groups = useMemo(() => {
    const known = Object.keys(labels.categories);
    const extra = [
      ...new Set(
        articles
          .map((article) => article.category)
          .filter((category) => !known.includes(category)),
      ),
    ];
    const total = articles.length;

    return [...known, ...extra].map((id) => {
      const items = articles.filter((article) => article.category === id);
      const count = items.length;
      const percent = total === 0 ? 0 : Math.round((count / total) * 100);
      return {
        id,
        label: labels.categories[id] ?? id,
        items,
        count,
        percent,
      };
    });
  }, [articles, labels.categories]);

  const maxMinutes = Math.max(
    1,
    ...articles.map((article) => article.readingMinutes),
  );

  if (articles.length === 0) {
    return <p className="empty-state">{labels.empty}</p>;
  }

  return (
    <div className="article-index">
      <div className="index-mix">
        <p className="index-mix-label">{t("distribution")}</p>
        <ul className="index-mix-list">
          {groups.map((group) => (
            <li
              key={group.id}
              className="index-mix-row"
              data-category={group.id}
            >
              <span className="index-mix-name">{group.label}</span>
              <span className="index-mix-track" aria-hidden="true">
                <span
                  className="index-mix-fill"
                  style={{ width: `${group.percent}%` }}
                />
              </span>
              <span className="index-mix-meta">
                {t("mixCount", {
                  count: group.count,
                  percent: group.percent,
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="article-columns">
        {groups.map((group) => (
          <section
            key={group.id}
            className="article-column"
            data-category={group.id}
            aria-labelledby={`article-col-${group.id}`}
          >
            <header className="article-column-head">
              <h2 id={`article-col-${group.id}`}>{group.label}</h2>
              <span>{group.count}</span>
            </header>
            {group.items.length === 0 ? (
              <p className="empty-state">{labels.empty}</p>
            ) : (
              <ul className="index-list">
                {group.items.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="index-link"
                    >
                      <span className="index-kicker">
                        <time dateTime={article.date}>
                          {formatDate(article.date, locale)}
                        </time>
                        <span className="index-read">
                          <ReadTicks
                            minutes={article.readingMinutes}
                            max={maxMinutes}
                          />
                          <span>
                            {t("minRead", {
                              minutes: article.readingMinutes,
                            })}
                          </span>
                        </span>
                      </span>
                      <span className="index-title">
                        {pickLocalized(article.title, locale)}
                      </span>
                      <span className="index-desc">
                        {pickLocalized(article.description, locale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
