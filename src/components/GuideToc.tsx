"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TocItem } from "@/lib/toc";

type Props = {
  items: TocItem[];
  labels: {
    tree: string;
    hide: string;
    show: string;
    search: string;
    searchPlaceholder: string;
    noResults: string;
    nav: string;
  };
};

export function GuideToc({ items, labels }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.text.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    }

    function jumpTo(id: string) {
      setActiveId(id);
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isTypingTarget(e.target) && e.target !== searchRef.current) return;
        e.preventDefault();
        setHidden(false);
        setSearchOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
        return;
      }

      if (e.key === "Escape") {
        if (searchOpen || query) {
          setSearchOpen(false);
          setQuery("");
          searchRef.current?.blur();
        }
        return;
      }

      if (isTypingTarget(e.target) && e.target !== searchRef.current) return;

      if (e.key === "h" || e.key === "H") {
        if (e.target === searchRef.current) return;
        setHidden((v) => !v);
        return;
      }

      if (e.key !== "j" && e.key !== "J" && e.key !== "k" && e.key !== "K") {
        return;
      }
      if (e.target === searchRef.current && query) {
        // allow j/k in search to move among filtered hits
      } else if (e.target === searchRef.current) {
        return;
      }

      e.preventDefault();
      const list = filtered.length ? filtered : items;
      if (!list.length) return;

      let index = list.findIndex((item) => item.id === activeId);
      if (index < 0) index = 0;

      const nextIndex =
        e.key === "j" || e.key === "J"
          ? Math.min(list.length - 1, index + 1)
          : Math.max(0, index - 1);
      const next = list[nextIndex];
      if (next) jumpTo(next.id);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, filtered, items, query, searchOpen]);

  if (!items.length) return null;

  function go(id: string) {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <aside className={`guide-toc ${hidden ? "is-hidden" : ""}`}>
      <div className="guide-toc-controls">
        <span>{labels.tree}</span>
        <div className="guide-toc-actions">
          <button
            type="button"
            onClick={() => {
              setHidden(false);
              setSearchOpen((v) => !v);
              requestAnimationFrame(() => searchRef.current?.focus());
            }}
            aria-label={labels.search}
            title={`${labels.search} (/)`}
          >
            /
          </button>
          <button type="button" onClick={() => setHidden((v) => !v)}>
            {hidden ? labels.show : labels.hide}
          </button>
        </div>
      </div>

      {!hidden ? (
        <>
          {searchOpen ? (
            <div className="guide-toc-search">
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder={labels.searchPlaceholder}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered[0]) {
                    e.preventDefault();
                    go(filtered[0].id);
                    setSearchOpen(false);
                    setQuery("");
                  }
                }}
              />
            </div>
          ) : null}

          <ol className="guide-toc-list">
            {filtered.map((item, i) => (
              <li
                key={`${item.id}-${i}`}
                className={[
                  item.level === 3 ? "level-3" : "",
                  activeId === item.id ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <a
                  href={`#${item.id}`}
                  title={`跳转到：${item.text}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.id);
                  }}
                >
                  <span className="toc-index">
                    {String(
                      items.findIndex((x) => x.id === item.id) + 1,
                    ).padStart(2, "0")}
                  </span>
                  <span className="toc-label">{item.text}</span>
                </a>
              </li>
            ))}
          </ol>

          {query && !filtered.length ? (
            <div className="guide-toc-empty">{labels.noResults}</div>
          ) : null}

          <div className="guide-toc-hint" aria-label="shortcuts">
            <span className="kbd">J</span>
            <span className="kbd">K</span>
            <span className="guide-toc-hint-label">{labels.nav}</span>
            <span className="guide-toc-hint-sep" aria-hidden>
              |
            </span>
            <span className="kbd">/</span>
            <span className="guide-toc-hint-label">{labels.search}</span>
          </div>
        </>
      ) : null}
    </aside>
  );
}
