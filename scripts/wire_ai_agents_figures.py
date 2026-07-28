#!/usr/bin/env python3
"""Replace OCR figure blobs in ai-agents-in-depth.mdx with markdown images."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MDX = ROOT / "content/guides/ai-agents-in-depth.mdx"
FIG = ROOT / "public/guides/ai-agents-in-depth/figures"
PDF_ZH = Path("/Users/laixiaoming/Downloads/AI-Agents-in-Depth-zh-CN.pdf")
PDF_EN = Path("/Users/laixiaoming/Downloads/AI-Agents-in-Depth-en.pdf")

OVERRIDE_ZH = {
    "1-1": "Agent 能力更新的三个层次",
    "10-1": "共享上下文与不共享上下文对比",
    "10-2": "基于阶段的角色切换",
    "10-3": "Agent 虚拟文件系统的四类区域挂载结构",
}
OVERRIDE_EN = {
    "1-1": "Three Levels of Agent Capability Updates",
    "10-1": "Shared Context vs. Non-Shared Context",
    "10-2": "Stage-based role switching",
    "10-3": "Mounting structure of the four area types in the Agent Virtual File System",
}

ZH_GLUE_MARKERS = (
    "上下文适应发生",
    "需要澄清的是",
    "角色转换：",
    "表 ",
    "本实验",
    "共享上下文依赖",
    "自主 Agent",
    "上半部分",
    "左侧是",
    "用一个简单",
    "随着 Agent",
    "实验结果",
    "让我们通过",
    "到这里你已经",
    "特别适用于",
    "注意力热力图",
    "可以把 Chat",
    "将四类区域",
    "熟悉操作系统",
)
EN_GLUE_MARKERS = (
    " To be clear",
    " Contextual adaptation",
    " The ",
    " This ",
    " In ",
    " Table ",
    " Let us",
    " Autonomous",
)


def available(locale: str) -> set[str]:
    return {
        m.group(1)
        for p in FIG.glob(f"{locale}-fig-*.png")
        if (m := re.match(rf"{locale}-fig-(\d+-\d+)\.png", p.name))
    }


def load_captions(pdf: Path, locale: str) -> dict[str, str]:
    if not pdf.exists():
        return {}
    text = subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    caps: dict[str, str] = {}
    if locale == "zh":
        pat = re.compile(r"图\s+(\d+)-(\d+)\s+([^\n]{2,80})")
    else:
        pat = re.compile(r"Figure\s+(\d+)-(\d+)[:\s]+([^\n]{2,100})", re.I)
    for m in pat.finditer(text):
        key = f"{m.group(1)}-{m.group(2)}"
        title = m.group(3).strip().rstrip("。．. ")
        if locale == "zh" and title.startswith(("所示", "给出", "展示")):
            continue
        prev = caps.get(key, "")
        if len(title) >= len(prev):
            caps[key] = title
    return caps


def split_locale(text: str) -> tuple[str, str, str]:
    m = re.search(r"<<<zh>>>\s*", text)
    m2 = re.search(r"<<<en>>>\s*", text)
    if not m or not m2:
        raise SystemExit("missing locale markers")
    return text[: m.end()], text[m.end() : m2.start()], text[m2.end() :]


def fix_prose_zh_1_1(block: str) -> str:
    old = (
        "前面讨论了模型如何通过强化学习将工具调用策略内化为原生能力。"
        "但 Agent 的行为改变不只发生在训练阶：任务内的上下文适应、跨任务的外段。"
        "按照更新发生的位置和持续时间，可以把它理解为三条互补路径（图 1-1）"
        "部产物（artifact）更新，以及训练周期中的参数更新。"
        " 1 Sutton, Rich. “The Bitter Lesson”, 2019. "
        "http://www.incompleteideas.net/IncIdeas/BitterLesson.html "
        "Agent 的行为如何发生改变？"
    )
    new = (
        "前面讨论了模型如何通过强化学习将工具调用策略内化为原生能力。"
        "但 Agent 的行为改变不只发生在训练阶段：任务内的上下文适应、跨任务的外部产物（artifact）更新，"
        "以及训练周期中的参数更新。"
        "按照更新发生的位置和持续时间，可以把它理解为三条互补路径（图 1-1）。"
        "\n\n"
        "> 1 Sutton, Rich. “The Bitter Lesson”, 2019. "
        "http://www.incompleteideas.net/IncIdeas/BitterLesson.html"
    )
    return block.replace(old, new, 1) if old in block else block


def split_title_and_after(raw: str, locale: str, key: str, curated: dict[str, str]) -> tuple[str, str]:
    if key in curated:
        title = curated[key]
        idx = raw.find(title)
        if idx >= 0:
            return title, raw[idx + len(title) :].strip()
    markers = ZH_GLUE_MARKERS if locale == "zh" else EN_GLUE_MARKERS
    cut = None
    for marker in markers:
        i = raw.find(marker)
        if i > 2:
            cut = i if cut is None else min(cut, i)
    if cut is not None:
        return raw[:cut].strip(" 。.:："), raw[cut:].strip()
    if locale == "zh":
        return raw[:40].split("。")[0].strip(), ""
    m = re.match(r"(.{5,90}?)(?:\.|$)", raw)
    return (m.group(1).strip() if m else raw[:60]), ""


def looks_like_ocr_line(line: str) -> bool:
    s = line.strip()
    if not s or s.startswith(("!", "#", ">", "-", "|", "```")):
        return False
    if re.search(r"(sys:\s*|tools:\s*|✓|✗|→\s*/|Scratchpad|Shared Workspace)", s):
        return True
    if re.search(r"(阶段\s*\d|Phase\s*\d|触发转换|工具集工具集|系统提示词系统提示词)", s):
        return True
    if re.search(r"(Glossary Agent|Translation Agent|Proofreading Agent|挂载 mount)", s):
        return True
    if len(s) > 100 and s.count("。") == 0 and ("agent:" in s or "write_file" in s):
        return True
    if s.startswith("▼") and ("上下文" in s or "context" in s.lower()):
        return True
    return False


def replace_ocr_blobs(
    block: str, locale: str, keys: set[str], captions: dict[str, str]
) -> tuple[str, int]:
    count = 0
    if locale == "zh":
        cap_re = re.compile(r"图\s*(\d+)-(\d+)\s+(.+)$")
    else:
        cap_re = re.compile(r"Figure\s+(\d+)-(\d+)[:\s]+(.+)$", re.I)

    curated = OVERRIDE_ZH if locale == "zh" else OVERRIDE_EN
    lines = block.split("\n")
    out: list[str] = []

    for line in lines:
        if line.strip().startswith("!["):
            out.append(line)
            continue
        m = cap_re.search(line)
        if not m:
            out.append(line)
            continue
        key = f"{m.group(1)}-{m.group(2)}"
        if key not in keys:
            out.append(line)
            continue

        prefix = line[: m.start()]
        stripped = line.strip()
        standalone_caption = bool(
            re.match(
                r"^(图|Figure)\s*\d+-\d+[:\s].{2,80}$",
                stripped,
                re.I,
            )
        )
        is_blob = (
            standalone_caption
            or len(line) > 80
            or bool(re.search(r"(sys:|tools:|✓|✗|→|/scratch|/workspace)", line))
            or (len(prefix) > 20)
            or looks_like_ocr_line(line)
        )
        # Skip mid-paragraph references like "如图 1-2 所示，五组..."
        if not is_blob:
            out.append(line)
            continue
        if "如图" in prefix[-6:] or "如图" in line[: m.start()][-8:]:
            # inline reference, not a figure dump
            if len(line) < 120 and not looks_like_ocr_line(line):
                out.append(line)
                continue

        raw_title = m.group(3).strip()
        title, after = split_title_and_after(raw_title, locale, key, {**captions, **curated})
        if key in curated:
            title = curated[key]
        elif key in captions:
            title = captions[key]
        elif standalone_caption:
            title = raw_title.strip(" 。.:：")

        title = title.strip(" 。.:：")
        img = f"![{title}](/guides/ai-agents-in-depth/figures/{locale}-fig-{key}.png)"

        pieces: list[str] = []
        lead = prefix.strip()
        if (
            lead
            and len(lead) < 80
            and ("。" in lead or lead.endswith(("：", ":", "）", ")")))
            and not looks_like_ocr_line(lead)
        ):
            pieces.append(lead)
        pieces.append(img)
        if after and len(after) > 10 and not standalone_caption:
            if (
                not re.match(r"^[✓✗→]", after)
                and "sys:" not in after[:30]
                and not looks_like_ocr_line(after[:80])
            ):
                pieces.append(after)

        while out:
            prev = out[-1]
            if prev.strip() == "" or prev.strip().startswith("!["):
                break
            if looks_like_ocr_line(prev):
                out.pop()
                continue
            break

        out.append("\n\n".join(pieces))
        count += 1

    return "\n".join(out), count


def retarget_existing_overview(block: str, locale: str) -> str:
    if locale == "zh":
        block = block.replace(
            "/guides/ai-agents-in-depth/figures/zh-000.png",
            "/guides/ai-agents-in-depth/figures/zh-fig-0-1.png",
        )
        block = block.replace(
            "/guides/ai-agents-in-depth/figures/zh-001.png",
            "/guides/ai-agents-in-depth/figures/zh-fig-0-2.png",
        )
    else:
        block = block.replace(
            "/guides/ai-agents-in-depth/figures/en-000.png",
            "/guides/ai-agents-in-depth/figures/en-fig-0-1.png",
        )
        block = block.replace(
            "/guides/ai-agents-in-depth/figures/en-001.png",
            "/guides/ai-agents-in-depth/figures/en-fig-0-2.png",
        )
    return block


def main():
    text = MDX.read_text(encoding="utf-8")
    pre, zh, en = split_locale(text)
    zh_keys, en_keys = available("zh"), available("en")
    print(f"available figures zh={len(zh_keys)} en={len(en_keys)}")

    zh_caps = load_captions(PDF_ZH, "zh")
    en_caps = load_captions(PDF_EN, "en")
    print(f"captions zh={len(zh_caps)} en={len(en_caps)}")

    zh = fix_prose_zh_1_1(zh)
    zh = retarget_existing_overview(zh, "zh")
    en = retarget_existing_overview(en, "en")
    zh, n1 = replace_ocr_blobs(zh, "zh", zh_keys, zh_caps)
    en, n2 = replace_ocr_blobs(en, "en", en_keys, en_caps)

    zh = re.sub(r"\n{4,}", "\n\n\n", zh)
    en = re.sub(r"\n{4,}", "\n\n\n", en)
    if not zh.endswith("\n"):
        zh += "\n"

    MDX.write_text(pre + zh + "<<<en>>>\n" + en, encoding="utf-8")
    print(f"replaced zh={n1} en={n2}")
    print("wrote", MDX)


if __name__ == "__main__":
    main()
