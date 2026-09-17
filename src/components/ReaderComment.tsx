"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const MAX_TEXT = 2000;
const MAX_NAME = 40;
const NAME_KEY = "reader_comment_name";

type Status = "idle" | "submitting" | "done";
type ErrorKind = "none" | "tooShort" | "failed";

/**
 * 读者留言入口。留言经 /api/feishu 推到作者的飞书，不公开、不需注册。
 * 与 FeedbackWidget 的区别：没有「有帮助 / 没帮助」的评分，且留言后可以接着再写。
 */
export function ReaderComment({ context }: { context: string }) {
  const t = useTranslations("readerComment");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<ErrorKind>("none");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved);
    } catch {
      // ignore
    }
  }, []);

  async function submit() {
    if (status === "submitting") return;
    const body = text.trim();
    if (body.length < 2) {
      setError("tooShort");
      return;
    }

    setStatus("submitting");
    setError("none");
    try {
      const res = await fetch("/api/feishu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "comment",
          text: body,
          name: name.trim(),
          context,
          pageUrl: window.location.href,
          pageTitle: document.title,
        }),
      });
      if (!res.ok) throw new Error("failed");
      try {
        if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // ignore
      }
      setStatus("done");
    } catch {
      setError("failed");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <section className="reader-comment is-done">
        <p className="reader-comment-thanks">{t("thanks")}</p>
        <p className="reader-comment-subnote">{t("thanksNote")}</p>
        <button
          type="button"
          className="reader-comment-again"
          onClick={() => {
            setText("");
            setError("none");
            setStatus("idle");
          }}
        >
          {t("again")}
        </button>
      </section>
    );
  }

  return (
    <section className="reader-comment">
      <span className="reader-comment-kicker">{t("kicker")}</span>
      <h3 className="reader-comment-title">{t("title")}</h3>
      <p className="reader-comment-lead">{t("lead")}</p>

      <div className="reader-comment-field">
        <label htmlFor="reader-comment-name">{t("nameLabel")}</label>
        <input
          id="reader-comment-name"
          type="text"
          value={name}
          maxLength={MAX_NAME}
          placeholder={t("namePlaceholder")}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="reader-comment-field">
        <label htmlFor="reader-comment-text">{t("textLabel")}</label>
        <textarea
          id="reader-comment-text"
          value={text}
          maxLength={MAX_TEXT}
          rows={4}
          placeholder={t("textPlaceholder")}
          onChange={(e) => {
            setText(e.target.value);
            if (error === "tooShort") setError("none");
          }}
        />
      </div>

      <div className="reader-comment-foot">
        <button
          type="button"
          className="reader-comment-submit"
          disabled={status === "submitting"}
          onClick={submit}
        >
          {status === "submitting" ? t("submitting") : t("submit")}
        </button>
        <span className="reader-comment-counter">
          {t("counter", { chars: text.length, max: MAX_TEXT })}
        </span>
      </div>

      {error === "tooShort" ? (
        <p className="reader-comment-error">{t("errorShort")}</p>
      ) : null}
      {error === "failed" ? (
        <p className="reader-comment-error">{t("errorFailed")}</p>
      ) : null}
    </section>
  );
}
