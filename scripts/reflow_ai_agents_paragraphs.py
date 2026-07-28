#!/usr/bin/env python3
"""Split mega paragraphs in ai-agents-in-depth.mdx for readable layout."""

from __future__ import annotations

import re
from pathlib import Path

MDX = Path(__file__).resolve().parents[1] / "content/guides/ai-agents-in-depth.mdx"

# Soft target length for a prose paragraph (chars).
ZH_SOFT = 220
ZH_HARD = 360
EN_SOFT = 320
EN_HARD = 520

ABBREV = {
    "e.g.",
    "i.e.",
    "etc.",
    "vs.",
    "Dr.",
    "Mr.",
    "Mrs.",
    "Ms.",
    "Prof.",
    "Fig.",
    "Eq.",
    "No.",
    "Vol.",
    "cf.",
    "al.",
    "U.S.",
    "U.K.",
}


def is_structural(block: str) -> bool:
    s = block.lstrip()
    if not s:
        return True
    if s.startswith(
        (
            "#",
            "```",
            "|",
            ">",
            "- ",
            "* ",
            "+ ",
            "![",
            "<<<",
            "---",
        )
    ):
        return True
    if re.match(r"^\d+\.\s+", s):
        return True
    if re.match(r"^[-*_]{3,}\s*$", s):
        return True
    # Keep short UI/code-ish lines alone
    if "\n" not in s and len(s) < 80 and re.search(r"[{}=<>]|://", s):
        return True
    return False


def split_zh_sentences(text: str) -> list[str]:
    parts: list[str] = []
    buf: list[str] = []
    i = 0
    while i < len(text):
        ch = text[i]
        buf.append(ch)
        if ch in "。！？；":
            # keep closing quotes with sentence
            j = i + 1
            while j < len(text) and text[j] in "”’）)】」』\":' ":
                buf.append(text[j])
                j += 1
            parts.append("".join(buf).strip())
            buf = []
            i = j
            continue
        i += 1
    if buf:
        tail = "".join(buf).strip()
        if tail:
            parts.append(tail)
    return [p for p in parts if p]


def split_en_sentences(text: str) -> list[str]:
    parts: list[str] = []
    buf: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        buf.append(ch)
        if ch in ".!?":
            # decimals / ellipsis / abbreviations
            prev = "".join(buf[-8:]).lower()
            if any(prev.endswith(a) for a in ABBREV):
                i += 1
                continue
            if ch == "." and i > 0 and text[i - 1].isdigit():
                # 3.14 or Fig. 2 — still check next
                pass
            j = i + 1
            while j < n and text[j] in "\"')]}":
                buf.append(text[j])
                j += 1
            # require whitespace + capital / quote start for hard break
            if j < n and text[j].isspace():
                k = j
                while k < n and text[k].isspace():
                    k += 1
                if k < n and (text[k].isupper() or text[k] in "\"'“("):
                    parts.append("".join(buf).strip())
                    buf = []
                    i = k
                    continue
        i += 1
    if buf:
        tail = "".join(buf).strip()
        if tail:
            parts.append(tail)
    return [p for p in parts if p]


def pack_sentences(sents: list[str], soft: int, hard: int, joiner: str) -> list[str]:
    if not sents:
        return []
    out: list[str] = []
    cur: list[str] = []
    cur_len = 0

    def flush() -> None:
        nonlocal cur, cur_len
        if cur:
            out.append(joiner.join(cur))
            cur = []
            cur_len = 0

    for s in sents:
        add = len(s) + (len(joiner) if cur else 0)
        if cur and (cur_len + add > hard or (cur_len >= soft and cur_len + add > soft)):
            flush()
        if cur:
            cur.append(s)
            cur_len += len(joiner) + len(s)
        else:
            cur = [s]
            cur_len = len(s)
        # very long single sentence: keep as its own paragraph
        if cur_len > hard and len(cur) == 1:
            flush()
    flush()
    return out


def reflow_block(block: str, lang: str) -> str:
    if is_structural(block):
        return block
    if lang == "zh":
        if block.count("。") + block.count("！") + block.count("？") < 2 and len(block) > 280:
            if "：" in block and block.count("。") == 0:
                return block
        sents = split_zh_sentences(block)
        if len(sents) <= 1 and len(block) < ZH_HARD:
            return block
        packed = pack_sentences(sents, ZH_SOFT, ZH_HARD, "")
        return "\n\n".join(packed) if len(packed) > 1 else block

    sents = split_en_sentences(block)
    if len(sents) <= 1 and len(block) < EN_HARD:
        return block
    packed = pack_sentences(sents, EN_SOFT, EN_HARD, " ")
    return "\n\n".join(packed) if len(packed) > 1 else block

def reflow_body(body: str, lang: str) -> str:
    # Preserve fenced code blocks intact
    parts = re.split(r"(```[\s\S]*?```)", body)
    out: list[str] = []
    for part in parts:
        if part.startswith("```"):
            out.append(part)
            continue
        blocks = re.split(r"(\n\s*\n)", part)
        rebuilt: list[str] = []
        for block in blocks:
            if re.fullmatch(r"\n\s*\n", block or ""):
                rebuilt.append(block)
                continue
            rebuilt.append(reflow_block(block, lang))
        # Normalize accidental triple blank lines
        chunk = "".join(rebuilt)
        chunk = re.sub(r"\n{3,}", "\n\n", chunk)
        out.append(chunk)
    return "".join(out)


def main() -> None:
    text = MDX.read_text(encoding="utf-8")
    front, rest = text.split("<<<zh>>>", 1)
    zh, en = rest.split("<<<en>>>", 1)
    zh2 = reflow_body(zh, "zh")
    en2 = reflow_body(en, "en")
    MDX.write_text(front + "<<<zh>>>" + zh2 + "<<<en>>>" + en2, encoding="utf-8")

    def count_long(body: str) -> tuple[int, int]:
        long400 = long800 = 0
        for b in re.split(r"\n\s*\n", body):
            b = b.strip()
            if not b or is_structural(b):
                continue
            n = len(b)
            if n >= 400:
                long400 += 1
            if n >= 800:
                long800 += 1
        return long400, long800

    print("zh long>=400/800", count_long(zh), "->", count_long(zh2))
    print("en long>=400/800", count_long(en), "->", count_long(en2))


if __name__ == "__main__":
    main()
