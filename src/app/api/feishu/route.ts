import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT = 2000;

type FeishuPost = {
  msg_type: "post";
  content: {
    post: {
      zh_cn: {
        title: string;
        content: { tag: string; text?: string; href?: string }[][];
      };
    };
  };
};

function clip(value: unknown, max = MAX_TEXT) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function sendToFeishu(payload: FeishuPost) {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    code?: number;
    StatusCode?: number;
    msg?: string;
  };

  if (data.code === 0 || data.StatusCode === 0) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "failed" }, { status: 502 });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const type = body.type;
  const pageUrl = clip(body.pageUrl, 2000);
  const pageTitle = clip(body.pageTitle, 300) || "（无标题）";
  if (!isHttpUrl(pageUrl)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  if (type === "feedback") {
    const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;
    if (!rating) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    const ratingText = rating === "up" ? "👍 有帮助" : "👎 没帮助";
    const comment = clip(body.comment) || "（无留言）";

    return sendToFeishu({
      msg_type: "post",
      content: {
        post: {
          zh_cn: {
            title: "📢 网站新反馈",
            content: [
              [{ tag: "text", text: `评价：${ratingText}` }],
              [{ tag: "text", text: `留言：${comment}` }],
              [{ tag: "a", text: "查看页面", href: pageUrl }],
              [{ tag: "text", text: `页面标题：${pageTitle}` }],
              [{ tag: "text", text: `提交时间：${now}` }],
            ],
          },
        },
      },
    });
  }

  if (type === "comment") {
    // 读者留言：不是「这页有没有帮助」，所以不复用 feedback 的 rating。
    const text = clip(body.text);
    if (text.length < 2) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    const name = clip(body.name, 60) || "匿名读者";
    const context = clip(body.context, 160) || "（未标注）";

    return sendToFeishu({
      msg_type: "post",
      content: {
        post: {
          zh_cn: {
            // 自定义关键词是「反馈」，标题里必须带上，否则会被飞书拦截
            title: "💬 读者留言反馈",
            content: [
              [{ tag: "text", text: `留言：${text}` }],
              [{ tag: "text", text: `署名：${name}` }],
              [{ tag: "text", text: `位置：${context}` }],
              [{ tag: "a", text: "查看页面", href: pageUrl }],
              [{ tag: "text", text: `页面标题：${pageTitle}` }],
              [{ tag: "text", text: `提交时间：${now}` }],
            ],
          },
        },
      },
    });
  }

  if (type === "subscribe") {
    const email = clip(body.email, 320).toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    return sendToFeishu({
      msg_type: "post",
      content: {
        post: {
          zh_cn: {
            // 自定义关键词是「反馈」，标题里必须带上，否则会被飞书拦截
            title: "📧 新邮箱订阅反馈",
            content: [
              [{ tag: "text", text: `邮箱：${email}` }],
              [{ tag: "a", text: "来源页面", href: pageUrl }],
              [{ tag: "text", text: `订阅时间：${now}` }],
            ],
          },
        },
      },
    });
  }

  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
