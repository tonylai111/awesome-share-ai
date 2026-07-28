#!/usr/bin/env python3
"""Pass-2 polish for ai-agents-in-depth.mdx (readable-content-polish)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MDX = ROOT / "content/guides/ai-agents-in-depth.mdx"
FIG = "/guides/ai-agents-in-depth/figures"


def split_mdx(text: str) -> tuple[str, str, str]:
    front, rest = text.split("<<<zh>>>", 1)
    zh, en = rest.split("<<<en>>>", 1)
    return front, zh, en


def join_mdx(front: str, zh: str, en: str) -> str:
    return front + "<<<zh>>>" + zh + "<<<en>>>" + en


def remove_ascii_diagram_zh(text: str) -> str:
    """Drop OCR/ASCII leftovers of Fig 0-1 / 0-2 already covered by PNGs."""
    # Between formula image block end and the RL mapping paragraph
    text = re.sub(
        r"(?s)\n第 6 章 评估 · 第 7 章 后训练\n.*?图 0-1 Agent = LLM \+ 上下文 \+ 工具\n+",
        "\n",
        text,
        count=1,
    )
    # Book-structure ASCII before 第一章（Agent 基础知识）prose / after 全书结构 para
    text = re.sub(
        r"(?s)\n第1章\n\nAgent 基础知识\n.*?图 0-2 全书结构[^\n]*\n+",
        "\n",
        text,
        count=1,
    )
    # leftover short diagram labels if any remain
    text = re.sub(r"(?m)^(LLM：大脑|上下文：眼睛|工具：手脚|评估贯穿全局|自主决策系统|构建 Agent|评估与进化|交互与协作)\n+", "", text)
    return text


def remove_ascii_diagram_en(text: str) -> str:
    text = re.sub(
        r"(?s)\nCh\. 6 Evaluation · Ch\. 7 Post-Training\n.*?Figure 0-1: Agent = LLM \+ Context \+ Tools\n+",
        "\n",
        text,
        count=1,
    )
    # alternate patterns from extraction
    text = re.sub(
        r"(?s)\nChapter 6 Evaluation.*?Figure 0-1:[^\n]*\n+",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r"(?s)\nCh\. 1\n\nAgent Fundamentals\n.*?Figure 0-2:[^\n]*\n+",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r"(?m)^Figure 0-2: Book Structure[^\n]*\n+",
        "",
        text,
    )
    return text


def fix_glued_section_titles(text: str, lang: str) -> str:
    if lang == "zh":
        reps = [
            ("全书结构本书", "### 全书结构\n\n本书"),
            ("如何阅读本书本书", "### 如何阅读本书\n\n本书"),
            ("如何阅读本书的", "### 如何阅读本书\n\n的"),  # unlikely
            ("前置知识Python", "### 前置知识\n\nPython"),
            ("前置知识必需", "### 前置知识\n\n必需"),
            ("致谢感谢", "### 致谢\n\n感谢"),
        ]
        # 如何阅读本书 followed by Chinese without break
        text = re.sub(r"(?<![#\n])如何阅读本书(?=[^\n#])", "### 如何阅读本书\n\n", text)
        text = re.sub(r"(?<![#\n])前置知识(?=[^\n#P必])", "### 前置知识\n\n", text)
    else:
        reps = [
            ("Book Structure This", "### Book Structure\n\nThis"),
            ("How to Read This Book The", "### How to Read This Book\n\nThe"),
            ("How to Read This Book If", "### How to Read This Book\n\nIf"),
            ("Prerequisites Python", "### Prerequisites\n\nPython"),
            ("Acknowledgments I", "### Acknowledgments\n\nI"),
            ("Acknowledgments Thank", "### Acknowledgments\n\nThank"),
        ]
    for a, b in reps:
        text = text.replace(a, b)
    return text


def demote_false_headings(text: str, lang: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    for ln in lines:
        if ln.startswith("### "):
            body = ln[4:]
            # price fragment promoted
            if re.match(r"^\d+\.\d+\s*倍", body) or body.startswith("1.25 倍"):
                out.append(body)
                continue
            # prose that starts with 实验 but isn't an experiment title
            if lang == "zh" and body.startswith("实验 ") and "★" not in body and "：" not in body[:20]:
                # "实验 2-7 是个小规模..." 
                if re.match(r"^实验 \d+-\d+ [^★：]", body) or "是个" in body[:30]:
                    out.append(body)
                    continue
            if lang == "en" and body.startswith("Experiment ") and "★" not in body:
                if not re.match(r"^Experiment \d+", body) or len(body) > 80:
                    # keep real Experiment N-M ★ titles only
                    if ":" not in body[:40] and "★" not in body:
                        out.append(body)
                        continue
        if ln.startswith("#### "):
            body = ln[5:]
            # #### should be X.Y.Z
            if not re.match(r"^\d+\.\d+\.\d+", body):
                out.append(body)
                continue
        out.append(ln)
    return "\n".join(out)


def strip_wrap_arrows(text: str) -> str:
    # PDF soft-wrap marker
    text = text.replace(" ↪\n", " ")
    text = text.replace("↪\n", "")
    text = text.replace(" ↪", " ")
    text = text.replace("↪", "")
    return text


def rejoin_broken_paragraphs(text: str) -> str:
    """Join paragraphs split by a blank line mid-sentence."""
    parts = re.split(r"(\n\n+)", text)
    out: list[str] = []
    i = 0
    while i < len(parts):
        chunk = parts[i]
        if re.fullmatch(r"\n\n+", chunk or ""):
            # look at prev and next content
            prev = out[-1] if out else ""
            nxt = parts[i + 1] if i + 1 < len(parts) else ""
            prev_s = prev.rstrip()
            nxt_s = nxt.lstrip() if nxt else ""
            if (
                prev_s
                and nxt_s
                and not prev_s.startswith("#")
                and not nxt_s.startswith("#")
                and not prev_s.startswith("```")
                and not nxt_s.startswith("```")
                and not prev_s.startswith("|")
                and not nxt_s.startswith(("- ", "* ", "> "))
                and not re.search(r"[。！？.!?:：；;]$", prev_s)
                and not re.match(r"^#{1,4} ", nxt_s)
            ):
                # join without blank
                if re.search(r"[\u4e00-\u9fff]$", prev_s) or re.search(
                    r"^[\u4e00-\u9fff]", nxt_s
                ):
                    out[-1] = prev_s + nxt_s
                else:
                    out[-1] = prev_s + " " + nxt_s
                i += 2  # skip sep + next (merged)
                continue
            out.append("\n\n")
            i += 1
            continue
        out.append(chunk)
        i += 1
    return "".join(out)


def fix_heading_order_snippets(text: str) -> str:
    """Surgical swaps for known out-of-order heading blocks."""
    # Move #### 1.2.7 before ### 1.3 if 1.2.7 appears after 1.3
    # Pattern: ### 1.3 ... #### 1.2.7 ... (until next ## or ### 思考题)
    m = re.search(
        r"(### 1\.3 本章小结\n\n.*?)(#### 1\.2\.7 本书作为 Harness 工程的实践指南\n\n.*?)(?=\n### 思考题|\n## )",
        text,
        re.S,
    )
    if m:
        summary, sec127 = m.group(1), m.group(2)
        text = text[: m.start()] + sec127 + summary + text[m.end() :]

    # EN equivalent
    m = re.search(
        r"(### 1\.3 Chapter Summary\n\n.*?)(#### 1\.2\.7 This Book as a Practical Guide to Harness Engineering\n\n.*?)(?=\n### Thought Questions|\n## )",
        text,
        re.S,
    )
    if m:
        summary, sec127 = m.group(1), m.group(2)
        text = text[: m.start()] + sec127 + summary + text[m.end() :]

    # #### 2.5.3 after ### 2.6 — move 2.5.3 before 2.6
    m = re.search(
        r"(### 2\.6 Agent 状态栏[^\n]*\n\n)(.*?)(#### 2\.5\.3 Skills 与工具的关系\n\n.*?)(?=\n### 实验 2-6|\n#### 2\.6\.1|\n### )",
        text,
        re.S,
    )
    if m:
        h26, between, sec253 = m.group(1), m.group(2), m.group(3)
        # only if between is short (likely empty or one line)
        if len(between) < 200:
            text = text[: m.start()] + sec253 + h26 + between + text[m.end() :]

    # #### 2.6.6 after ### 2.7
    m = re.search(
        r"(### 2\.7 上下文压缩策略\n\n)(.*?)(#### 2\.6\.6 设计哲学\n\n.*?)(?=\n#### 2\.7\.1|\n### )",
        text,
        re.S,
    )
    if m:
        h27, between, sec266 = m.group(1), m.group(2), m.group(3)
        if len(between) < 200:
            text = text[: m.start()] + sec266 + h27 + between + text[m.end() :]

    return text


def dedupe_consecutive_headings(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    for ln in lines:
        if ln.startswith("#") and out:
            # skip if same as last non-empty
            j = len(out) - 1
            while j >= 0 and not out[j].strip():
                j -= 1
            if j >= 0 and out[j] == ln:
                continue
        out.append(ln)
    return "\n".join(out)


def normalize_chapter_rules(text: str) -> str:
    """Keep --- only between ## chapters; collapse excess blanks."""
    # collapse 3+ blanks
    text = re.sub(r"\n{3,}", "\n\n", text)
    # multiple --- 
    text = re.sub(r"(?:\n---\n)+", "\n\n---\n\n", text)
    return text


def relocate_overview_figures(text: str, lang: str) -> str:
    """Place overview figures after the sentences that introduce them."""
    if lang == "zh":
        # remove current early figures under ## 引言
        text = re.sub(
            rf"\n!\[全书架构总览\]\({FIG}/zh-001\.png\)\n+",
            "\n",
            text,
            count=1,
        )
        text = re.sub(
            rf"\n!\[Agent = LLM \+ 上下文 \+ 工具\]\({FIG}/zh-000\.png\)\n+",
            "\n",
            text,
            count=1,
        )
        # after formula sentence ending 手脚。
        needle = "更直观地说，就是大脑 + 眼睛 + 手脚。"
        if needle in text and f"]({FIG}/zh-000.png)" not in text.split("<<<")[0]:
            text = text.replace(
                needle,
                needle
                + f"\n\n![Agent = LLM + 上下文 + 工具]({FIG}/zh-000.png)",
                1,
            )
        # after 全书结构 paragraph intro
        needle2 = "第九至十章则把视野扩展到多模态交互与多 Agent 协作。"
        if needle2 in text:
            text = text.replace(
                needle2,
                needle2 + f"\n\n![全书架构总览]({FIG}/zh-001.png)",
                1,
            )
    else:
        text = re.sub(
            rf"\n!\[Book architecture overview\]\({FIG}/en-001\.png\)\n+",
            "\n",
            text,
            count=1,
        )
        text = re.sub(
            rf"\n!\[Agent = LLM \+ Context \+ Tools\]\({FIG}/en-000\.png\)\n+",
            "\n",
            text,
            count=1,
        )
        needle = "More intuitively, it is Brain + Eyes + Hands and Feet."
        if needle in text:
            text = text.replace(
                needle,
                needle
                + f"\n\n![Agent = LLM + Context + Tools]({FIG}/en-000.png)",
                1,
            )
        needle2 = "Chapters 9 and 10 broaden the scope to multimodal interaction and multi-agent collaboration."
        if needle2 in text:
            text = text.replace(
                needle2,
                needle2
                + f"\n\n![Book architecture overview]({FIG}/en-001.png)",
                1,
            )
    return text


def fence_obvious_code(text: str) -> str:
    """Light touch: fence blocks that start with messages: [ or tools = [ on own line context."""
    # Don't over-fence; only standalone JSON-looking paragraphs starting with { and role
    def repl(m: re.Match) -> str:
        body = m.group(1).strip()
        if body.startswith("```"):
            return m.group(0)
        return f"\n\n```text\n{body}\n```\n\n"

    # Skip for now — fencing broken PDF JSON often makes it worse.
    return text


def polish_locale(body: str, lang: str) -> str:
    # Keep site intro (写在前面 / Before you start) untouched until first ## 引言/Introduction
    if lang == "zh":
        mark = "## 引言"
    else:
        mark = "## Introduction"
    idx = body.find(mark)
    if idx < 0:
        head, rest = "", body
    else:
        head, rest = body[:idx], body[idx:]

    if lang == "zh":
        rest = remove_ascii_diagram_zh(rest)
    else:
        rest = remove_ascii_diagram_en(rest)

    rest = strip_wrap_arrows(rest)
    rest = fix_glued_section_titles(rest, lang)
    rest = demote_false_headings(rest, lang)
    rest = fix_heading_order_snippets(rest)
    rest = dedupe_consecutive_headings(rest)
    rest = relocate_overview_figures(rest, lang)
    # rejoin may need multiple passes
    for _ in range(3):
        nxt = rejoin_broken_paragraphs(rest)
        if nxt == rest:
            break
        rest = nxt
    rest = normalize_chapter_rules(rest)
    rest = fence_obvious_code(rest)
    return head + rest


def main() -> None:
    raw = MDX.read_text(encoding="utf-8")
    front, zh, en = split_mdx(raw)
    zh2 = polish_locale(zh, "zh")
    en2 = polish_locale(en, "en")
    out = join_mdx(front, zh2, en2)
    MDX.write_text(out, encoding="utf-8")

    def stats(label: str, body: str) -> None:
        imgs = re.findall(r"!\[.*?\]\((.*?)\)", body)
        print(label, "chars", len(body), "imgs", len(imgs), imgs)
        print("  ↪", body.count("↪"), "全书结构本书", "全书结构本书" in body, "1.25 heading", "### 1.25" in body)
        print("  Agentic break", "Agentic\n\nReinforcement" in body)

    stats("zh", zh2)
    stats("en", en2)


if __name__ == "__main__":
    main()
