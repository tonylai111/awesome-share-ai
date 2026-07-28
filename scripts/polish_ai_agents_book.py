#!/usr/bin/env python3
"""Page-range extraction + polish → bilingual MDX for AI Agents in Depth."""
from __future__ import annotations

import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content/guides/ai-agents-in-depth.mdx"
FIG = "/guides/ai-agents-in-depth/figures"
ZH_PDF = Path.home() / "Downloads/AI-Agents-in-Depth-zh-CN.pdf"
EN_PDF = Path.home() / "Downloads/AI-Agents-in-Depth-en.pdf"

ZH_OFF, EN_OFF = 8, 8

ZH_CHAPS = [
    ("引言", 1, 6),
    ("第 1 章 AI Agent 入门", 7, 25),
    ("第 2 章 上下文工程", 26, 69),
    ("第 3 章 用户记忆和知识库", 70, 100),
    ("第 4 章 工具", 101, 128),
    ("第 5 章 Coding Agent 与代码生成", 129, 159),
    ("第 6 章 Agent 的评估", 160, 187),
    ("第 7 章 模型后训练", 188, 228),
    ("第 8 章 Agent 的持续进化", 229, 243),
    ("第 9 章 多模态与实时交互", 244, 269),
    ("第 10 章 多 Agent 协作", 270, 303),
    ("后记：回到 Agent = LLM + 上下文 + 工具", 304, 306),
]

EN_CHAPS = [
    ("Introduction", 1, 7),
    ("Chapter 1 Getting Started with AI Agents", 8, 31),
    ("Chapter 2 Context Engineering", 32, 82),
    ("Chapter 3 User Memory and Knowledge Base", 83, 121),
    ("Chapter 4 Tools", 122, 157),
    ("Chapter 5 Coding Agent and Code Generation", 158, 197),
    ("Chapter 6 Evaluating Agents", 198, 234),
    ("Chapter 7 Model Post-Training", 235, 287),
    ("Chapter 8 Continual Evolution of Agents", 288, 307),
    ("Chapter 9 Multimodality and Real-Time Interaction", 308, 341),
    ("Chapter 10 Multi-Agent Collaboration", 342, 381),
    ("Afterword: Back to Agent = LLM + Context + Tools", 382, 384),
]


def pdf_pages(pdf: Path, start: int, end: int) -> str:
    return subprocess.check_output(
        ["pdftotext", "-f", str(start), "-l", str(end), str(pdf), "-"],
        text=True,
        errors="replace",
    )


def pdf_total_pages(pdf: Path) -> int:
    info = subprocess.check_output(["pdfinfo", str(pdf)], text=True, errors="replace")
    return int(re.search(r"Pages:\s+(\d+)", info).group(1))


def headingify(s: str, lang: str) -> str | None:
    # Titles only — reject long prose that happens to start with "Chapter N".
    if len(s) > 90:
        return None
    if lang == "zh":
        if s == "引言" or (s.startswith("后记") and len(s) < 40):
            return f"## {s}"
        if re.match(r"^第 \d+ 章 [\w\u4e00-\u9fffA-Za-z].{0,40}$", s):
            return f"## {s}"
        if re.match(r"^实验 ", s) or s in {"本章小结", "思考题"}:
            return f"### {s}"
        if re.match(r"^\d+\.\d+\.\d+(\.\d+)?\s+\S", s) and len(s) < 80:
            return f"#### {s}"
        if re.match(r"^\d+\.\d+\s+\S", s) and len(s) < 80:
            return f"### {s}"
    else:
        if s == "Introduction" or (s.startswith("Afterword") and len(s) < 80):
            return f"## {s}"
        # e.g. "Chapter 1 Getting Started with AI Agents" / "Chapter 10 Multi-Agent Collaboration"
        if re.match(r"^Chapter \d+\s+[A-Z].{5,70}$", s) and not s.endswith((".", ",", ";", ":")):
            return f"## {s}"
        if re.match(r"^Experiment ", s) or s in {"Chapter Summary", "Thought Questions"}:
            return f"### {s}"
        if re.match(r"^\d+\.\d+\.\d+(\.\d+)?\s+\S", s) and len(s) < 80:
            return f"#### {s}"
        if re.match(r"^\d+\.\d+\s+\S", s) and len(s) < 80:
            return f"### {s}"
    return None


def clean_chapter(text: str, lang: str, title: str) -> str:
    text = text.replace("\f", "\n\n")
    text = re.sub(r"(?m)^\s*\d+\s*$", "", text)
    text = re.sub(r"(?m)^.*\.{5,}.*$", "", text)

    lines = text.splitlines()
    out_lines: list[str] = []
    prev_blank = False
    for ln in lines:
        s = ln.strip()
        if not s:
            if not prev_blank:
                out_lines.append("")
            prev_blank = True
            continue
        prev_blank = False
        if lang == "zh" and s in {"深入理解 AI Agent", "设计原理与工程实践", "目录"}:
            continue
        if lang == "en" and s in {
            "AI Agents in Depth",
            "Design Principles and Engineering Practice",
            "CONTENTS",
            "Contents",
        }:
            continue
        out_lines.append(ln)
    text = "\n".join(out_lines)

    blocks = re.split(r"\n\s*\n", text)
    polished: list[str] = []
    seen_title = False

    for block in blocks:
        raw = block.strip()
        if not raw:
            continue
        blines = [x.strip() for x in raw.splitlines() if x.strip()]
        if not blines:
            continue

        h = headingify(blines[0], lang)
        if h and len(blines) == 1:
            if h.startswith("## ") and title in h:
                if seen_title:
                    continue
                seen_title = True
            polished.append(h)
            continue

        if h and len(blines) > 1:
            if h.startswith("## ") and title in h:
                if not seen_title:
                    polished.append(h)
                    seen_title = True
                body_lines = blines[1:]
            else:
                polished.append(h)
                body_lines = blines[1:]
        else:
            body_lines = blines

        if not body_lines:
            continue

        if any(
            x.startswith(("```", "|", "- ", "* ", ">>>", "$ "))
            or re.match(r"^\d+\. ", x)
            for x in body_lines[:1]
        ):
            polished.append("\n".join(body_lines))
            continue

        para = body_lines[0]
        for ln in body_lines[1:]:
            hh = headingify(ln, lang)
            if hh:
                if para:
                    polished.append(para)
                polished.append(hh)
                para = ""
                continue
            if not para:
                para = ln
                continue
            if re.search(r"[\u4e00-\u9fff]$", para) or re.search(
                r"^[\u4e00-\u9fff]", ln
            ):
                para += ln
            elif para.endswith("-"):
                para = para[:-1] + ln
            else:
                para += " " + ln
        if para:
            polished.append(para)

    result = "\n\n".join(polished).strip()
    if not result.startswith("## "):
        result = f"## {title}\n\n{result}"

    lines = result.splitlines()
    out: list[str] = []
    prev = None
    for ln in lines:
        if ln.strip() and ln.strip() == prev and len(ln.strip()) > 25:
            continue
        if ln.startswith(("### ", "#### ")) and out and out[-1] == ln:
            continue
        out.append(ln)
        prev = ln.strip() if ln.strip() else prev
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()


def strip_orphan_heading_runs(text: str) -> str:
    """For ### headings that repeat (PDF running headers), keep one with body."""
    lines = text.splitlines()
    freq = Counter(ln for ln in lines if ln.startswith("### "))
    heavy = {h for h, n in freq.items() if n >= 3}

    keep_idx: set[int] = set()
    for h in heavy:
        idxs = [i for i, ln in enumerate(lines) if ln == h]
        chosen = None
        for i in idxs:
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            nxt = lines[j] if j < len(lines) else ""
            if nxt and not nxt.startswith("#"):
                chosen = i
                break
        if chosen is None and idxs:
            chosen = idxs[0]
        if chosen is not None:
            keep_idx.add(chosen)

    out: list[str] = []
    for i, ln in enumerate(lines):
        if ln in heavy and i not in keep_idx:
            continue
        out.append(ln)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out))


def extract_book(pdf: Path, chaps: list[tuple[str, int, int]], offset: int, lang: str) -> str:
    total = pdf_total_pages(pdf)
    parts: list[str] = []
    for i, (title, b0, b1) in enumerate(chaps):
        p0 = b0 + offset
        p1 = min(b1 + offset, total)
        if i == len(chaps) - 1:
            p1 = total
        print(f"[{lang}] {title}: PDF {p0}-{p1}")
        raw = pdf_pages(pdf, p0, p1)
        parts.append(clean_chapter(raw, lang, title))
    return "\n\n---\n\n".join(parts)


def demote_false_h2(text: str, lang: str) -> str:
    """Intro diagram labels and formula blurbs must not be H2."""
    out = []
    for ln in text.splitlines():
        if ln.startswith("## "):
            body = ln[3:]
            if lang == "zh":
                if "·" in body and body.startswith("第 "):
                    out.append(body)
                    continue
                if body.startswith("核心思想"):
                    out.append(body)
                    continue
            else:
                if body.startswith("Core Idea"):
                    out.append(body)
                    continue
                if re.match(r"^Chapter \d+$", body):
                    out.append(body)
                    continue
        out.append(ln)
    text = "\n".join(out)

    # Demote early chapter H2s that appear inside the introduction before Ch.1
    if lang == "zh":
        marker = "## 第 1 章 "
    else:
        marker = "## Chapter 1 "
    idx = text.find(marker)
    if idx > 0:
        head, tail = text[:idx], text[idx:]
        if lang == "zh":
            head = re.sub(r"(?m)^## (第 \d+ 章 .+)$", r"\1", head)
        else:
            head = re.sub(r"(?m)^## (Chapter \d+ .+)$", r"\1", head)
        text = head + tail
    return text


def main() -> None:
    print("Extracting ZH...")
    zh = extract_book(ZH_PDF, ZH_CHAPS, ZH_OFF, "zh")
    print("Extracting EN...")
    en = extract_book(EN_PDF, EN_CHAPS, EN_OFF, "en")

    zh = demote_false_h2(zh, "zh")
    en = demote_false_h2(en, "en")

    zh = zh.replace(
        "## 引言",
        f"## 引言\n\n![全书架构总览]({FIG}/zh-001.png)\n\n![Agent = LLM + 上下文 + 工具]({FIG}/zh-000.png)",
        1,
    )
    en = en.replace(
        "## Introduction",
        f"## Introduction\n\n![Book architecture overview]({FIG}/en-001.png)\n\n![Agent = LLM + Context + Tools]({FIG}/en-000.png)",
        1,
    )

    zh = strip_orphan_heading_runs(zh)
    en = strip_orphan_heading_runs(en)

    front = """---
title:
  zh: "深入理解 AI Agent：设计原理与工程实践"
  en: "AI Agents in Depth: Design Principles and Engineering Practice"
description:
  zh: "李博杰著。Agent = LLM + 上下文 + 工具。十章从入门到多 Agent，站内可读 + PDF 下载。"
  en: "By Bojie Li. Agent = LLM + Context + Tools. Ten chapters, readable on-site + PDF download."
date: "2026-07-28"
tags: [ai-agent, context-engineering, harness, tools, multi-agent]
readingMinutes: 480
theme: agent-book
prompt: "tony@agent-book:~$"
accent: "#2F5D50"
displayName: AGENT
icon: agent
cta: "$ less agents.md →"
---

"""

    intro_zh = """## 写在前面

本指南同步自李博杰《深入理解 AI Agent：设计原理与工程实践》（v1.3，2026-07-27）。正文按 PDF 页码逐章抽取，并做了可读性清洗：去掉分页断行、目录点线与页眉页码，统一标题层级。配图对齐中英文各 2 张总览图；完整排版与全部插图请下载原 PDF。

- 中文 PDF：[下载](/guides/AI-Agents-in-Depth-zh-CN.pdf)
- 英文 PDF：[下载](/guides/AI-Agents-in-Depth-en.pdf)
- 开源正文与实验：[bojieli/ai-agent-book](https://github.com/bojieli/ai-agent-book)（Apache-2.0）

核心公式：**Agent = LLM + 上下文 + 工具**。

## 目录

1. 引言
2. 第 1 章 AI Agent 入门
3. 第 2 章 上下文工程
4. 第 3 章 用户记忆和知识库
5. 第 4 章 工具
6. 第 5 章 Coding Agent 与代码生成
7. 第 6 章 Agent 的评估
8. 第 7 章 模型后训练
9. 第 8 章 Agent 的持续进化
10. 第 9 章 多模态与实时交互
11. 第 10 章 多 Agent 协作
12. 后记

---

"""

    intro_en = """## Before you start

Adapted from Bojie Li, *AI Agents in Depth* (v1.3, 2026-07-27). Chapters extracted by PDF page range and cleaned for reading: page breaks, TOC leader dots, and running headers removed; heading levels normalized. Two overview figures are aligned in zh/en; for the full illustration set, download the PDF.

- Chinese PDF: [Download](/guides/AI-Agents-in-Depth-zh-CN.pdf)
- English PDF: [Download](/guides/AI-Agents-in-Depth-en.pdf)
- Source & labs: [bojieli/ai-agent-book](https://github.com/bojieli/ai-agent-book) (Apache-2.0)

Core formula: **Agent = LLM + Context + Tools**.

## Contents

1. Introduction
2. Chapter 1 Getting Started with AI Agents
3. Chapter 2 Context Engineering
4. Chapter 3 User Memory and Knowledge Base
5. Chapter 4 Tools
6. Chapter 5 Coding Agent and Code Generation
7. Chapter 6 Evaluating Agents
8. Chapter 7 Model Post-Training
9. Chapter 8 Continual Evolution of Agents
10. Chapter 9 Multimodality and Real-Time Interaction
11. Chapter 10 Multi-Agent Collaboration
12. Afterword

---

"""

    body = front + "<<<zh>>>\n" + intro_zh + zh + "\n<<<en>>>\n" + intro_en + en + "\n"
    OUT.write_text(body, encoding="utf-8")
    print("Wrote", OUT, "MB", round(OUT.stat().st_size / 1024 / 1024, 2))
    print("ZH ##", len(re.findall(r"^## ", zh, re.M)), "EN ##", len(re.findall(r"^## ", en, re.M)))
    print("ZH imgs", len(re.findall(r"!\[.*?\]\(", zh)), "EN imgs", len(re.findall(r"!\[.*?\]\(", en)))
    c = Counter(ln for ln in zh.splitlines() if ln.startswith("### "))
    print("heavy ###", sorted(((k, v) for k, v in c.items() if v > 3), key=lambda x: -x[1])[:8])
    print("ZH head:\n", zh[:500])
    print("EN head:\n", en[:500])


if __name__ == "__main__":
    main()
