"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { useEffect, useRef, useState } from "react";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="locale-switcher" ref={ref}>
      <button
        type="button"
        className="locale-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        {t(locale)}
        <span className="locale-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul className="locale-menu" role="listbox">
          {routing.locales.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <button
                type="button"
                className={code === locale ? "active" : undefined}
                onClick={() => {
                  router.replace(pathname, { locale: code });
                  setOpen(false);
                }}
              >
                {code === locale ? <span className="check">✓</span> : <span className="check" />}
                {t(code)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
