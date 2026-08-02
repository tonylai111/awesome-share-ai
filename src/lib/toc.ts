export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

const TOC_HEADINGS = new Set([
  "目录",
  "Contents",
  "Table of Contents",
]);

/** Skill-template / embedded-doc noise that leaks as H2 in long reference guides. */
const JUNK_H2 = new Set([
  "instructions",
  "format",
  "security analysis",
  "performance patterns",
  "review output format",
  "core concepts",
  "quick reference",
  "key files",
  "deep dive",
  "input validation",
  "architecture",
  "code standards",
  "commands",
  "patterns",
  "important notes",
  "recent decisions",
  "security requirements",
  "approved tools",
]);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-");
}

function stripMd(text: string): string {
  return text.replace(/[#*`]/g, "").trim();
}

/** Prefer an in-page TOC only when entries are already wired with hash links. */
function extractExplicitToc(markdown: string): TocItem[] | null {
  const lines = markdown.split("\n");
  let inFence = false;
  let collecting = false;
  const linked: TocItem[] = [];
  let plainCount = 0;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const title = stripMd(h2[1]);
      if (TOC_HEADINGS.has(title)) {
        collecting = true;
        continue;
      }
      if (collecting) break;
    }

    if (!collecting) continue;
    // Allow blank lines and Part labels inside an in-page TOC block.
    if (!line.trim()) continue;
    if (/^###\s+/.test(line)) continue;

    const link = line.match(
      /^(?:\d+\.|[-*])\s+\[([^\]]+)\]\(#([^)]+)\)/,
    );
    if (link) {
      linked.push({ id: link[2], text: link[1].trim(), level: 2 });
      continue;
    }

    if (/^(?:\d+\.|[-*])\s+/.test(line)) {
      plainCount += 1;
      continue;
    }

    if (linked.length || plainCount) break;
  }

  if (linked.length >= 5 && linked.length >= plainCount) return linked;
  return null;
}

export function extractToc(markdown: string): TocItem[] {
  const explicit = extractExplicitToc(markdown);
  if (explicit) return explicit;

  const items: TocItem[] = [];
  const lines = markdown.split("\n");
  let inFence = false;
  const seen = new Map<string, number>();

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = stripMd(match[2]);
    if (level === 2 && JUNK_H2.has(text.toLowerCase())) continue;
    if (TOC_HEADINGS.has(text)) continue;

    let id = slugify(text);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    items.push({ id, text, level });
  }

  const h2 = items.filter((item) => item.level === 2);
  if (h2.length >= 12) return h2;
  return items;
}
