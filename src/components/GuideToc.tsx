"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  /**
   * Start collapsed when the viewport is at or below this width.
   * Desktop stays open. Used by article pages so the same TOC
   * can sit in a side column and fold down on a phone.
   */
  collapseBelow?: number;
};

function useMaxWidth(maxPx?: number) {
  const query = maxPx ? `(max-width: ${maxPx}px)` : "";

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!query) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => (query ? window.matchMedia(query).matches : false),
    [query],
  );

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function GuideToc({ items, labels, collapseBelow }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const narrow = useMaxWidth(collapseBelow);
  const [manualHidden, setManualHidden] = useState<boolean | null>(null);
  const [prevNarrow, setPrevNarrow] = useState(narrow);
  if (narrow !== prevNarrow) {
    setPrevNarrow(narrow);
    setManualHidden(null);
  }

  const hidden = manualHidden ?? (collapseBelow != null && narrow);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.text.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    let frame = 0;

    function sync() {
      // The heading that has most recently crossed the upper third is
      // the one being read. A scroll listener catches jumps that an
      // intersection observer misses when a heading skips the band.
      const line = window.innerHeight * 0.32;
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = item.id;
      }
      if (current) setActiveId(current);
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    }

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
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
        setManualHidden(false);
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
        setManualHidden(!hidden);
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
  }, [activeId, filtered, hidden, items, query, searchOpen]);

  if (!items.length) return null;

  function go(id: string) {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <aside
      className={[
        "guide-toc",
        hidden ? "is-hidden" : "",
        !hidden && narrow ? "is-user-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="guide-toc-controls">
        <span>{labels.tree}</span>
        <div className="guide-toc-actions">
          <button
            type="button"
            onClick={() => {
              setManualHidden(false);
              setSearchOpen((v) => !v);
              requestAnimationFrame(() => searchRef.current?.focus());
            }}
            aria-label={labels.search}
            title={`${labels.search} (/)`}
          >
            /
          </button>
          <button type="button" onClick={() => setManualHidden(!hidden)}>
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
