/** Client-safe number formatters (no fs). */

export function formatWordCount(n: number, locale: string): string {
  const rounded = n >= 1000 ? Math.round(n / 100) * 100 : n;
  if (locale === "zh") {
    return n >= 1000
      ? `约 ${rounded.toLocaleString("zh-CN")} 字`
      : `${n.toLocaleString("zh-CN")} 字`;
  }
  return n >= 1000
    ? `~${rounded.toLocaleString("en-US")} words`
    : `${n.toLocaleString("en-US")} words`;
}
