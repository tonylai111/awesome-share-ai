"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

const links = [
  { href: "/about" as const, key: "about" as const },
  { href: "/works" as const, key: "works" as const },
  { href: "/articles" as const, key: "articles" as const },
  { href: "/guides" as const, key: "guides" as const },
];

export function Header() {
  const t = useTranslations("nav");
  const tMeta = useTranslations("meta");
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          {tMeta("siteName")}
        </Link>

        <nav className="nav-links" aria-label="Main">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "nav-link active" : "nav-link"}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="header-tools">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
