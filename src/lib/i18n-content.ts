import type { Locale } from "@/i18n/routing";

export type LocalizedString = { zh: string; en: string };

export function pickLocalized(
  value: LocalizedString,
  locale: Locale,
): string {
  return value[locale] ?? value.zh;
}

export function formatDate(date: string, locale: Locale): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
