#!/usr/bin/env python3
"""Generate clean grayscale diagrams for AI Agents in Depth guide."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "public/guides/ai-agents-in-depth/figures"
OUT.mkdir(parents=True, exist_ok=True)

FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_EN = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

# palette (grayscale like the book diagrams)
BG = (250, 250, 250)
INK = (45, 45, 48)
MUTED = (110, 110, 115)
LINE = (180, 180, 185)
CARD = (255, 255, 255)
HEAD = (90, 90, 95)
SOFT = (236, 236, 238)
DARK = (55, 55, 58)
OK = (55, 120, 80)
BAD = (150, 60, 60)


def font(size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(FONT, size=size, index=index)
    except Exception:
        return ImageFont.truetype(FONT_EN, size=size)


def round_rect(draw: ImageDraw.ImageDraw, box, fill, outline=LINE, radius=14, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_w(draw, text, fnt) -> int:
    b = draw.textbbox((0, 0), text, font=fnt)
    return b[2] - b[0]


def center_text(draw, cx, y, text, fnt, fill=INK):
    w = text_w(draw, text, fnt)
    draw.text((cx - w / 2, y), text, font=fnt, fill=fill)


def wrap(draw, text, fnt, max_w: int) -> list[str]:
    lines: list[str] = []
    cur = ""
    for ch in text:
        trial = cur + ch
        if text_w(draw, trial, fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines or [""]


def save(img: Image.Image, name: str):
    path = OUT / name
    img.save(path, "PNG", optimize=True)
    print("wrote", path.name, img.size)


# ─── Figure 1-1 ─────────────────────────────────────────────────────────────

def fig_1_1(locale: str):
    zh = locale == "zh"
    W, H = 1200, 720
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title = "Agent 的行为如何发生改变？" if zh else "How does Agent behavior change?"
    f_title = font(28)
    round_rect(d, (280, 36, 920, 92), DARK, outline=DARK, radius=28)
    center_text(d, W // 2, 52, title, f_title, fill=(255, 255, 255))

    # branch lines
    d.line([(W // 2, 92), (W // 2, 130)], fill=LINE, width=2)
    d.line([(200, 130), (1000, 130)], fill=LINE, width=2)
    for x in (200, 600, 1000):
        d.line([(x, 130), (x, 160)], fill=LINE, width=2)
        d.polygon([(x, 168), (x - 6, 156), (x + 6, 156)], fill=LINE)

    cols = (
        (
            "任务内适应" if zh else "In-task adaptation",
            "Context adaptation",
            "主要载体" if zh else "Carrier",
            "当前上下文" if zh else "Current context",
            "示例 · 状态 · 检索结果" if zh else "Examples · Status · Retrieval",
            "更新特性" if zh else "Update traits",
            "即时、低成本" if zh else "Instant, low cost",
            "任务结束后不自动保留" if zh else "Not kept after the task",
        ),
        (
            "外部制品更新" if zh else "External artifacts",
            "External artifacts",
            "主要载体" if zh else "Carrier",
            "知识 · 指令 · 程序" if zh else "Knowledge · Instr. · Programs",
            "文档 · Prompt/Skill · Harness",
            "更新特性" if zh else "Update traits",
            "跨任务持久、可审计" if zh else "Cross-task, auditable",
            "依赖检索或工具调用" if zh else "Needs retrieval / tools",
        ),
        (
            "模型参数更新" if zh else "Parameter update",
            "Parameter update",
            "主要载体" if zh else "Carrier",
            "模型权重" if zh else "Model weights",
            "SFT · 偏好训练 · RL" if zh else "SFT · Preference · RL",
            "更新特性" if zh else "Update traits",
            "高维能力、广泛泛化" if zh else "High-dim, broad generalization",
            "训练与回归成本较高" if zh else "High train / regression cost",
        ),
    )
    f_h = font(22)
    f_sub = font(14)
    f_lab = font(13)
    f_body = font(16)
    f_small = font(14)
    card_w, card_h = 340, 380
    ys = 175
    for i, c in enumerate(cols):
        x0 = 70 + i * 380
        round_rect(d, (x0, ys, x0 + card_w, ys + card_h), CARD, radius=16, width=2)
        round_rect(d, (x0, ys, x0 + card_w, ys + 78), SOFT, outline=LINE, radius=16)
        # cover bottom radius of header
        d.rectangle((x0 + 1, ys + 50, x0 + card_w - 1, ys + 78), fill=SOFT)
        center_text(d, x0 + card_w // 2, ys + 16, c[0], f_h)
        center_text(d, x0 + card_w // 2, ys + 46, c[1], f_sub, MUTED)
        y = ys + 100
        center_text(d, x0 + card_w // 2, y, c[2], f_lab, MUTED)
        center_text(d, x0 + card_w // 2, y + 28, c[3], f_body)
        center_text(d, x0 + card_w // 2, y + 56, c[4], f_small, MUTED)
        d.line([(x0 + 28, y + 100), (x0 + card_w - 28, y + 100)], fill=LINE, width=1)
        center_text(d, x0 + card_w // 2, y + 120, c[5], f_lab, MUTED)
        center_text(d, x0 + card_w // 2, y + 152, c[6], f_body)
        center_text(d, x0 + card_w // 2, y + 182, c[7], f_small, MUTED)

    foot = (
        "三者协同：临场适应 · 可控积累 · 能力内化"
        if zh
        else "Synergy: adapt in-place · accumulate controllably · internalize capability"
    )
    round_rect(d, (70, 590, 1130, 660), SOFT, radius=18)
    center_text(d, W // 2, 612, foot, font(18))
    save(img, f"{locale}-fig-1-1.png")


# ─── Figure 10-1 ────────────────────────────────────────────────────────────

def fig_10_1(locale: str):
    zh = locale == "zh"
    W, H = 1280, 860
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title = "图 10-1 共享上下文与不共享上下文对比" if zh else "Figure 10-1 Shared vs Non-shared Context"
    center_text(d, W // 2, 24, title, font(24))

    # left panel
    round_rect(d, (40, 80, 620, 720), CARD, radius=12, width=2)
    d.rounded_rectangle((40, 80, 620, 720), radius=12, outline=MUTED, width=2)
    # dashed feel via second stroke offset - approximate with light border
    left_title = "共享上下文（继承式协作）" if zh else "Shared context (inherited)"
    center_text(d, 330, 98, left_title, font(18))

    stages = [
        (
            "阶段 1：需求分析师" if zh else "Stage 1: Requirements Analyst",
            'sys: "充分理解需求…"' if zh else 'sys: "Understand requirements…"',
            "tools: [ask_question, save_req]",
            'user: "写一个 CSV 分析脚本"' if zh else 'user: "Write a CSV analysis script"',
            'agent: "需要处理哪些文件类型？"' if zh else 'agent: "Which file types?"',
        ),
        (
            "阶段 2：软件工程师" if zh else "Stage 2: Software Engineer",
            'sys: "根据已确认需求写代码…"' if zh else 'sys: "Code from confirmed requirements…"',
            "tools: [write_file, execute_code]",
            'agent: write_file("analyze.py", …)',
            'agent: execute_code("python test.py")',
        ),
        (
            "阶段 3：代码审查员" if zh else "Stage 3: Code Reviewer",
            'sys: "审查质量与安全性…"' if zh else 'sys: "Review quality & security…"',
            "tools: [run_linter, run_tests]",
            "agent: run_linter → 2 warnings",
            "agent: approve_code()",
        ),
    ]
    y = 140
    for i, s in enumerate(stages):
        fill = SOFT if i == 0 else CARD
        round_rect(d, (60, y, 600, y + 150), fill, radius=10)
        d.text((80, y + 12), s[0], font=font(16), fill=INK)
        for j, line in enumerate(s[1:]):
            d.text((88, y + 42 + j * 24), line, font=font(13), fill=MUTED if j < 2 else INK)
        y += 165

    bar = "↑ 所有阶段共享同一对话历史" if zh else "↑ All stages share one conversation history"
    round_rect(d, (60, 650, 600, 695), SOFT, radius=8)
    center_text(d, 330, 662, bar, font(14))
    d.text((80, 730), "✓ " + ("完整轨迹" if zh else "Full trajectory"), font=font(15), fill=OK)
    d.text((80, 760), "✗ " + ("上下文快速膨胀" if zh else "Context grows fast"), font=font(15), fill=BAD)

    # right panel
    round_rect(d, (660, 80, 1240, 720), CARD, radius=12, width=2)
    right_title = "不共享上下文（隔离式协作）" if zh else "Non-shared context (isolated)"
    center_text(d, 950, 98, right_title, font(18))

    agents = [
        ("Glossary Agent", 'sys: "识别术语并翻译…"' if zh else 'sys: "Find & translate terms…"', "→ glossary.json"),
        ("Translation Agent", 'sys: "翻译本章内容…"' if zh else 'sys: "Translate the chapter…"', "→ chapter1_zh.md"),
        ("Proofreading Agent", 'sys: "检查术语一致性…"' if zh else 'sys: "Check term consistency…"', "→ review_report.md"),
    ]
    y = 140
    for name, sys, out in agents:
        round_rect(d, (690, y, 1210, y + 110), CARD, radius=10)
        d.text((710, y + 14), name, font=font(16), fill=INK)
        d.text((710, y + 46), sys, font=font(13), fill=MUTED)
        d.text((710, y + 74), "tools: [read_file, write_file]  " + out, font=font(13), fill=INK)
        y += 125

    round_rect(d, (690, 530, 1210, 640), SOFT, radius=10)
    fs = "共享文件系统" if zh else "Shared file system"
    d.text((710, 548), fs, font=font(16), fill=INK)
    d.text((710, 580), "glossary.json · chapter1_zh.md · review_report.md", font=font(13), fill=MUTED)
    d.text(
        (710, 608),
        "+ " + ("工具调用参数传递结构化数据" if zh else "Structured data via tool args"),
        font=font(13),
        fill=MUTED,
    )
    d.text(
        (690, 730),
        "✓ " + ("模块化 · 可扩展 · 并行" if zh else "Modular · Scalable · Parallel"),
        font=font(15),
        fill=OK,
    )
    d.text(
        (690, 760),
        "✗ " + ("信息同步复杂" if zh else "Sync is complex"),
        font=font(15),
        fill=BAD,
    )
    save(img, f"{locale}-fig-10-1.png")


# ─── Figure 10-2 ────────────────────────────────────────────────────────────

def fig_10_2(locale: str):
    zh = locale == "zh"
    W, H = 1400, 780
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title = "图 10-2 基于阶段的角色切换" if zh else "Figure 10-2 Phase-based role switching"
    center_text(d, W // 2, 20, title, font(24))
    banner = (
        "▼ 同一上下文连续流动 — 对话历史在阶段间完整保留 ▼"
        if zh
        else "▼ Same context flows continuously — history kept across phases ▼"
    )
    round_rect(d, (120, 70, 1280, 118), SOFT, radius=10)
    center_text(d, W // 2, 84, banner, font(16))

    phases = [
        (
            "阶段 1 需求分析师" if zh else "Phase 1 Requirements Analyst",
            "你的职责是充分理解需求。不要急于实现，在这个阶段你的任务是提问和确认。"
            if zh
            else "Fully understand requirements. Do not implement yet—ask and confirm.",
            ["ask_clarifying_question(q)", "save_requirement(k, v)", "complete_req_analysis()"],
            "complete_req_analysis()",
        ),
        (
            "阶段 2 软件工程师" if zh else "Phase 2 Software Engineer",
            "根据已确认的需求编写高质量 Python 代码。遵循模块化、错误处理最佳实践。"
            if zh
            else "Write solid Python from confirmed requirements. Modular + error handling.",
            ["write_file(path, content)", "read_file(path)", "execute_code(code)"],
            "submit_for_review()",
        ),
        (
            "阶段 3 代码审查员" if zh else "Phase 3 Code Reviewer",
            "从多个维度评估代码质量：功能正确性、代码规范、安全性。采用批判性思维。"
            if zh
            else "Critique correctness, style, and security with a critical mindset.",
            ["run_linter(file)", "run_tests(file)", "analyze_complexity(file)"],
            None,
        ),
    ]
    pw = 380
    for i, (name, prompt, tools, trigger) in enumerate(phases):
        x0 = 70 + i * 440
        round_rect(d, (x0, 150, x0 + pw, 620), CARD, radius=14, width=2)
        center_text(d, x0 + pw // 2, 168, name, font(18))
        d.text((x0 + 24, 210), "系统提示词" if zh else "System prompt", font=font(13), fill=MUTED)
        round_rect(d, (x0 + 20, 235, x0 + pw - 20, 360), SOFT, radius=8)
        yy = 248
        for line in wrap(d, prompt, font(13), pw - 60):
            d.text((x0 + 32, yy), line, font=font(13), fill=INK)
            yy += 22
        d.text((x0 + 24, 380), "工具集" if zh else "Tools", font=font(13), fill=MUTED)
        round_rect(d, (x0 + 20, 405, x0 + pw - 20, 530), SOFT, radius=8)
        for j, t in enumerate(tools):
            d.text((x0 + 36, 420 + j * 28), t, font=font(14), fill=INK)
        if trigger:
            round_rect(d, (x0 + 50, 550, x0 + pw - 50, 595), DARK, outline=DARK, radius=10)
            center_text(d, x0 + pw // 2, 562, trigger, font(14), fill=(255, 255, 255))
            # arrow to next
            ax = x0 + pw + 10
            d.polygon([(ax, 370), (ax + 28, 360), (ax + 28, 380)], fill=DARK)
            d.line([(ax + 28, 370), (ax + 50, 370)], fill=DARK, width=3)

    foot = (
        "角色转换：更新系统提示词 + 工具集，对话历史和状态连续保留"
        if zh
        else "Role switch: update system prompt + tools; history & state stay continuous"
    )
    center_text(d, W // 2, 680, foot, font(16), MUTED)
    save(img, f"{locale}-fig-10-2.png")


# ─── Figure 10-3 ────────────────────────────────────────────────────────────

def fig_10_3(locale: str):
    zh = locale == "zh"
    W, H = 1320, 900
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title = (
        "图 10-3 Agent 虚拟文件系统的四类区域挂载结构"
        if zh
        else "Figure 10-3 Four mount zones of the Agent VFS"
    )
    center_text(d, W // 2, 20, title, font(22))

    # top actors
    round_rect(d, (80, 80, 220, 150), SOFT, radius=10)
    center_text(d, 150, 105, "Agent A", font(16))
    round_rect(d, (80, 170, 220, 240), SOFT, radius=10)
    center_text(d, 150, 195, "Agent B", font(16))

    round_rect(d, (320, 100, 1000, 220), CARD, radius=12, width=2)
    center_text(d, 660, 120, "虚拟文件系统 /" if zh else "Virtual File System /", font(20))
    center_text(
        d,
        660,
        160,
        "统一接口：read_file · write_file · list_dir" if zh else "API: read_file · write_file · list_dir",
        font(14),
        MUTED,
    )

    round_rect(d, (1100, 100, 1240, 200), CARD, radius=10)
    center_text(d, 1170, 125, "用户" if zh else "User", font(16))
    center_text(d, 1170, 155, "上传 / 下载" if zh else "Up / Download", font(13), MUTED)

    d.line([(220, 115), (320, 150)], fill=LINE, width=2)
    d.line([(220, 205), (320, 180)], fill=LINE, width=2)
    d.line([(1000, 160), (1100, 150)], fill=LINE, width=2)

    zones = [
        (
            "Agent 专属工作区" if zh else "Agent workspace",
            "/scratch/<id>",
            "Scratchpad",
            [
                "私有 · 仅该 Agent" if zh else "Private · per Agent",
                "随实例销毁" if zh else "Dies with instance",
                "读写 · 无需并发控制" if zh else "R/W · no concurrency",
                "每个 Agent 各一份" if zh else "One copy each",
            ],
        ),
        (
            "多 Agent 共享空间" if zh else "Shared workspace",
            "/workspace/shared",
            "Shared Workspace",
            [
                "用户可见 · 持久化" if zh else "User-visible · durable",
                "读写 · 需并发控制" if zh else "R/W · needs locking",
                "乐观锁 · worktree" if zh else "Optimistic lock · worktree",
            ],
        ),
        (
            "外部挂载资源" if zh else "External mounts",
            "/mnt/gdrive · /mnt/notion",
            "经适配器 adapter" if zh else "via adapter",
            [
                "受外部授权约束" if zh else "External auth limits",
                "多为只读 · 写需谨慎" if zh else "Mostly read-only",
                "延迟高 · 一致性弱" if zh else "High latency · weak consistency",
            ],
        ),
        (
            "系统内置资源" if zh else "Built-in resources",
            "/skills",
            "Skills · 模板 · 手册" if zh else "Skills · templates · manuals",
            [
                "全局共享 · 只读" if zh else "Global · read-only",
                "跨会话稳定" if zh else "Stable across sessions",
                "渐进式披露" if zh else "Progressive disclosure",
            ],
        ),
    ]
    zw = 280
    for i, (name, path, sub, bullets) in enumerate(zones):
        x0 = 60 + i * 310
        round_rect(d, (x0, 280, x0 + zw, 620), CARD, radius=12, width=2)
        d.line([(660, 220), (x0 + zw // 2, 280)], fill=LINE, width=2)
        center_text(d, x0 + zw // 2, 300, name, font(15))
        center_text(d, x0 + zw // 2, 335, path, font(13), MUTED)
        center_text(d, x0 + zw // 2, 360, sub, font(13), MUTED)
        for j, b in enumerate(bullets):
            d.text((x0 + 24, 410 + j * 36), "· " + b, font=font(14), fill=INK)

    # mount label
    d.text((500, 240), "挂载 mount" if zh else "mount", font=font(13), fill=MUTED)

    round_rect(d, (680, 680, 1000, 800), CARD, radius=10, width=1)
    # dashed feel
    center_text(d, 840, 710, "外部数据源" if zh else "External sources", font(15))
    center_text(d, 840, 745, "Google Drive · Notion", font(14), MUTED)
    d.line([(840, 680), (840, 620)], fill=LINE, width=2)

    save(img, f"{locale}-fig-10-3.png")


def main():
    for loc in ("zh", "en"):
        fig_1_1(loc)
        fig_10_1(loc)
        fig_10_2(loc)
        fig_10_3(loc)
    print("done →", OUT)


if __name__ == "__main__":
    main()
