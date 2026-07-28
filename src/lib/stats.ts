export { formatWordCount } from "@/lib/stats-format";

/** Rough reading length: CJK chars + Latin words. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|=]/g, " ");

  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) ?? []).length;
  return cjk + latin;
}
