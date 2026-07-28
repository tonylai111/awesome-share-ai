#!/usr/bin/env python3
"""Extract book figures from AI Agents PDFs by cropping caption-anchored page regions."""

from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/guides/ai-agents-in-depth/figures"
OUT.mkdir(parents=True, exist_ok=True)

PDFS = {
    "zh": Path("/Users/laixiaoming/Downloads/AI-Agents-in-Depth-zh-CN.pdf"),
    "en": Path("/Users/laixiaoming/Downloads/AI-Agents-in-Depth-en.pdf"),
}
# fall back to public copies
for loc, p in list(PDFS.items()):
    if not p.exists():
        alt = ROOT / (
            "public/guides/AI-Agents-in-Depth-zh-CN.pdf"
            if loc == "zh"
            else "public/guides/AI-Agents-in-Depth-en.pdf"
        )
        PDFS[loc] = alt

DPI = 160
# skip screenshots / book cover-style that may be huge or wrong
SKIP = set()  # can add "1-6" etc.


def page_map(pdf: Path, locale: str) -> dict[str, list[int]]:
    r = subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    pages = r.stdout.split("\f")
    figs: dict[str, list[int]] = {}
    if locale == "zh":
        pat = re.compile(r"图\s+(\d+)-(\d+)\s+\S")
    else:
        pat = re.compile(r"Figure\s+(\d+)-(\d+)[:\s]", re.I)
    for i, page in enumerate(pages, 1):
        for m in pat.finditer(page):
            key = f"{m.group(1)}-{m.group(2)}"
            figs.setdefault(key, []).append(i)
    return figs


def render_page(pdf: Path, page: int, tmp: Path) -> Path:
    prefix = tmp / f"p{page}"
    subprocess.run(
        [
            "pdftoppm",
            "-png",
            "-r",
            str(DPI),
            "-f",
            str(page),
            "-l",
            str(page),
            str(pdf),
            str(prefix),
        ],
        check=True,
    )
    # pdftoppm zero-pads: p19-019.png
    matches = sorted(tmp.glob(f"p{page}*.png"))
    if not matches:
        raise FileNotFoundError(f"no render for page {page}")
    return matches[0]


def row_density(im: Image.Image, step_y=2, step_x=3, thresh=248) -> list[float]:
    gray = im.convert("L")
    w, h = gray.size
    pix = gray.load()
    dens = [0.0] * h
    cols = max(1, w // step_x)
    for y in range(0, h, step_y):
        dark = 0
        for x in range(0, w, step_x):
            if pix[x, y] < thresh:
                dark += 1
        dens[y] = dark / cols
        if y + 1 < h:
            dens[y + 1] = dens[y]
    return dens


def find_caption_y(im: Image.Image, locale: str, chap: str, num: str) -> int | None:
    """Find approximate vertical position of figure caption via dense text line search.

    Captions are usually short centered lines near bottom of figure.
    We detect a narrow horizontal band of dark text after a large figure block.
    """
    # Use OCR-free heuristic later; for now scan with pdf bbox if available
    return None


def bbox_captions(pdf: Path, page: int, locale: str) -> list[tuple[str, float, float, float, float]]:
    """Return (key, x1,y1,x2,y2) in PDF points for captions on page."""
    r = subprocess.run(
        ["pdftotext", "-bbox", "-f", str(page), "-l", str(page), str(pdf), "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    out: list[tuple[str, float, float, float, float]] = []
    # HTML-like: <word xMin=... yMin=... xMax=... yMax=...>text</word>
    words = re.findall(
        r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>',
        r.stdout,
    )
    parsed = [
        (float(x1), float(y1), float(x2), float(y2), t)
        for x1, y1, x2, y2, t in words
    ]
    # Cluster words into lines with y tolerance (CJK caption "图" / "1-1" often differ by ~2pt)
    parsed.sort(key=lambda w: (w[1], w[0]))
    lines: list[list[tuple[float, float, float, float, str]]] = []
    for w in parsed:
        if not lines or abs(w[1] - lines[-1][0][1]) > 4.0:
            lines.append([w])
        else:
            lines[-1].append(w)

    zh_pat = re.compile(r"图\s*(\d+)\s*-\s*(\d+)")
    en_pat = re.compile(r"Figure\s+(\d+)\s*-\s*(\d+)", re.I)
    for ws in lines:
        ws.sort(key=lambda w: w[0])
        text_sp = " ".join(w[4] for w in ws).strip()
        text_join = "".join(w[4] for w in ws).strip()
        # Prefer true captions (line starts with 图/Figure), not mid-paragraph refs
        m = None
        if locale == "zh":
            if text_join.startswith("图") or text_sp.startswith("图"):
                m = zh_pat.match(text_sp) or zh_pat.match(text_join) or zh_pat.search(text_sp)
        else:
            if re.match(r"Figure\b", text_sp, re.I) or re.match(r"Figure\b", text_join, re.I):
                m = en_pat.match(text_sp) or en_pat.search(text_sp)
        if m:
            key = f"{m.group(1)}-{m.group(2)}"
            x1 = min(w[0] for w in ws)
            y1 = min(w[1] for w in ws)
            x2 = max(w[2] for w in ws)
            y2 = max(w[3] for w in ws)
            out.append((key, x1, y1, x2, y2))
    return out


def crop_figure(
    im: Image.Image,
    caption_y_pts: float,
    page_h_pts: float = 841.89,
    page_w_pts: float = 595.28,
) -> Image.Image:
    """Crop figure region above caption."""
    w, h = im.size
    scale_y = h / page_h_pts
    scale_x = w / page_w_pts
    cap_y = int(caption_y_pts * scale_y)

    dens = row_density(im)
    # find bottom of figure: walk up from caption until dense content, then continue until sparse gap
    y = max(0, cap_y - int(8 * scale_y))
    # skip caption band
    while y > 40 and dens[y] > 0.01:
        y -= 1
    # now in whitespace above caption; walk up into figure
    while y > 40 and dens[y] < 0.008:
        y -= 1
    fig_bottom = min(h - 5, y + int(6 * scale_y))
    # walk up through figure until sustained whitespace (paragraph gap) or top margin
    fig_top = fig_bottom
    gap = 0
    min_fig_h = int(80 * scale_y)
    y = fig_bottom
    while y > int(60 * scale_y):
        y -= 1
        if dens[y] < 0.008:
            gap += 1
            # require a decent whitespace gap after we've collected enough figure height
            if gap > int(18 * scale_y) and (fig_bottom - y) > min_fig_h:
                fig_top = y + gap
                break
        else:
            gap = 0
            fig_top = y
    else:
        fig_top = int(70 * scale_y)

    # trim horizontal margins: find content bounds
    gray = im.convert("L")
    pix = gray.load()
    left, right = 0, w
    for x in range(w):
        col_dark = any(pix[x, yy] < 245 for yy in range(fig_top, fig_bottom, 3))
        if col_dark:
            left = max(0, x - 8)
            break
    for x in range(w - 1, -1, -1):
        col_dark = any(pix[x, yy] < 245 for yy in range(fig_top, fig_bottom, 3))
        if col_dark:
            right = min(w, x + 8)
            break

    # pad
    fig_top = max(0, fig_top - 6)
    fig_bottom = min(h, fig_bottom + 4)
    if right - left < 100 or fig_bottom - fig_top < 60:
        # fallback: wide crop above caption
        fig_top = max(0, cap_y - int(320 * scale_y))
        fig_bottom = max(fig_top + 80, cap_y - int(10 * scale_y))
        left, right = int(40 * scale_x), w - int(40 * scale_x)

    return im.crop((left, fig_top, right, fig_bottom))


def extract_locale(locale: str, only: set[str] | None = None) -> list[str]:
    pdf = PDFS[locale]
    if not pdf.exists():
        print("missing pdf", pdf)
        return []
    figs = page_map(pdf, locale)
    written: list[str] = []
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        # cache rendered pages
        rendered: dict[int, Path] = {}
        keys = sorted(figs.keys(), key=lambda k: tuple(map(int, k.split("-"))))
        for key in keys:
            if only and key not in only:
                continue
            if key in SKIP:
                continue
            pages = figs[key]
            # prefer the page where caption appears as standalone (usually last mention is caption)
            page = pages[-1]
            cap = None
            # Prefer later pages; on a page prefer the last matching caption line
            for p in reversed(pages):
                caps = [c for c in bbox_captions(pdf, p, locale) if c[0] == key]
                if caps:
                    cap = caps[-1]
                    page = p
                    break
            if not cap:
                print("skip (no bbox)", locale, key, "pages", pages)
                continue
            if page not in rendered:
                rendered[page] = render_page(pdf, page, tmp)
            im = Image.open(rendered[page])
            crop = crop_figure(im, cap[2])  # yMin
            # filter tiny / empty
            if crop.width < 80 or crop.height < 50:
                print("skip tiny", locale, key, crop.size)
                continue
            out = OUT / f"{locale}-fig-{key}.png"
            # white background flatten
            if crop.mode != "RGB":
                crop = crop.convert("RGB")
            crop.save(out, "PNG", optimize=True)
            written.append(out.name)
            print("wrote", out.name, crop.size, "page", page)
    return written


def main():
    import sys

    only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
    for loc in ("zh", "en"):
        extract_locale(loc, only)
    print("done →", OUT)


if __name__ == "__main__":
    main()
