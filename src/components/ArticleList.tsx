"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ArticleMeta } from "@/lib/types";
import { formatDate, pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";

type Props = {
  articles: ArticleMeta[];
  locale: Locale;
  labels: {
    all: string;
    categories: Record<string, string>;
    empty: string;
  };
};

export function ArticleList({ articles, locale, labels }: Props) {
  const t = useTranslations("articles");
  const [category, setCategory] = useState<string>("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: articles.length };
    for (const article of articles) {
      map[article.category] = (map[article.category] ?? 0) + 1;
    }
    return map;
  }, [articles]);

  const filtered =
    category === "all"
      ? articles
      : articles.filter((a) => a.category === category);

  const pills = [
    { id: "all", label: labels.all },
    ...Object.keys(labels.categories).map((id) => ({
      id,
      label: labels.categories[id],
    })),
  ];

  return (
    <div className="articles-page">
      <div className="category-pills" role="tablist">
        {pills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            role="tab"
            aria-selected={category === pill.id}
            className={category === pill.id ? "pill active" : "pill"}
            onClick={() => setCategory(pill.id)}
          >
            {pill.label} {counts[pill.id] ?? 0}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">{labels.empty}</p>
      ) : (
        <ul className="article-list">
          {filtered.map((article) => (
            <li key={article.slug}>
              <article className="article-item">
                <div className="article-meta">
                  <time dateTime={article.date}>
                    {formatDate(article.date, locale)}
                  </time>
                  <span>
                    {t("minRead", { minutes: article.readingMinutes })}
                  </span>
                </div>
                <h2>
                  <Link href={`/articles/${article.slug}`}>
                    {pickLocalized(article.title, locale)}
                  </Link>
                </h2>
                <p>{pickLocalized(article.description, locale)}</p>
                <div className="tag-row">
                  {article.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
