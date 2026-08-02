#!/usr/bin/env node
/**
 * Local Markdown preview with relative images/SVGs.
 *
 * Usage:
 *   node scripts/md-preview.mjs [path/to/file.md] [--port 4173]
 *   npm run preview:md -- ~/Downloads/Hermes-Agent-从入门到精通-v260407.md
 *
 * Opens a browser page that renders the Markdown and serves sibling assets
 * (e.g. ./hermes-agent-assets/*.svg) from the same directory.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const args = process.argv.slice(2).filter((a) => a !== "--");
let port = 4173;
let mdArg = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1]) {
    port = Number(args[++i]);
    continue;
  }
  if (!args[i].startsWith("-") && !mdArg) mdArg = args[i];
}

const defaultMd = path.resolve(
  process.env.HOME || "",
  "Downloads/Hermes-Agent-从入门到精通-v260407.md",
);
const mdPath = path.resolve(mdArg || defaultMd);

if (!fs.existsSync(mdPath) || !mdPath.endsWith(".md")) {
  console.error(`Markdown not found: ${mdPath}`);
  console.error("Usage: npm run preview:md -- /path/to/file.md [--port 4173]");
  process.exit(1);
}

const root = path.dirname(mdPath);
const mdName = path.basename(mdPath);

const MIME = {
  ".md": "text/markdown; charset=utf-8",
  ".markdown": "text/markdown; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(base, reqPath) {
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(base, cleaned);
  if (!full.startsWith(base)) return null;
  return full;
}

function pageHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MD Preview · ${escapeHtml(mdName)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js"></script>
  <style>
    /* Force light scheme: github-markdown-css dark text + our white card
       otherwise collide (light gray text on white = "washed out" body copy). */
    :root { color-scheme: light only; }
    html { color-scheme: light only; }
    body {
      margin: 0;
      background: #f6f8fa;
      color: #24292f;
      font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB",
        "Microsoft YaHei", system-ui, sans-serif;
    }
    .bar {
      position: sticky; top: 0; z-index: 10;
      display: flex; gap: 12px; align-items: center;
      padding: 10px 20px;
      border-bottom: 1px solid #d0d7de;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(8px);
      font-size: 13px; color: #57606a;
    }
    .bar strong { color: #24292f; }
    .bar button {
      border: 1px solid #d0d7de; background: #fff; border-radius: 6px;
      padding: 4px 10px; cursor: pointer; font: inherit; color: #24292f;
    }
    .wrap { max-width: 920px; margin: 24px auto; padding: 0 20px 64px; }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      padding: 32px 40px;
      border-radius: 12px;
      border: 1px solid #d0d7de;
      background: #fff !important;
      color: #24292f !important;
    }
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3,
    .markdown-body h4,
    .markdown-body p,
    .markdown-body li,
    .markdown-body td,
    .markdown-body th,
    .markdown-body blockquote {
      color: inherit;
    }
    .markdown-body img,
    .markdown-body svg {
      max-width: 100%;
      height: auto;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #eaeef2;
    }
    .err { color: #cf222e; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="bar">
    <strong>${escapeHtml(mdName)}</strong>
    <span id="status">loading…</span>
    <button type="button" id="reload">Reload</button>
    <span style="margin-left:auto;opacity:.8">relative images/SVGs OK</span>
  </div>
  <div class="wrap">
    <article id="content" class="markdown-body"><p>Loading…</p></article>
  </div>
  <script>
    const MD_URL = ${JSON.stringify("/__md/" + encodeURIComponent(mdName))};
    const statusEl = document.getElementById("status");
    const contentEl = document.getElementById("content");

    marked.setOptions({ gfm: true, breaks: false });

    async function render() {
      statusEl.textContent = "loading…";
      try {
        const res = await fetch(MD_URL + "?t=" + Date.now());
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        const md = await res.text();
        contentEl.innerHTML = marked.parse(md);
        statusEl.textContent = new Date().toLocaleTimeString() + " · ok";
        document.title = "MD Preview · ${escapeHtml(mdName)}";
      } catch (e) {
        contentEl.innerHTML = '<p class="err">' + String(e) + "</p>";
        statusEl.textContent = "error";
      }
    }

    document.getElementById("reload").onclick = render;
    render();
  </script>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(pageHtml());
    return;
  }

  if (url.pathname.startsWith("/__md/")) {
    const name = decodeURIComponent(url.pathname.slice("/__md/".length));
    if (name !== mdName) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(mdPath).pipe(res);
    return;
  }

  const filePath = safeJoin(root, url.pathname);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Markdown preview`);
  console.log(`  file: ${mdPath}`);
  console.log(`  root: ${root}`);
  console.log(`  open: ${url}`);
  const opener =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(opener, () => {});
});
