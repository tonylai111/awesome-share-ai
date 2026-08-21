"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Rating = "up" | "down";

export function FeedbackWidget() {
  const t = useTranslations("feedback");
  const [selected, setSelected] = useState<Rating | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(`feedback_submitted_${window.location.pathname}`)) {
        setStatus("done");
      }
    } catch {
      // ignore
    }
  }, []);

  async function submit() {
    if (!selected || status === "submitting") return;
    setStatus("submitting");
    setError(false);
    try {
      const res = await fetch("/api/feishu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "feedback",
          rating: selected,
          comment,
          pageUrl: window.location.href,
          pageTitle: document.title,
        }),
      });
      if (!res.ok) throw new Error("failed");
      try {
        localStorage.setItem(`feedback_submitted_${window.location.pathname}`, "1");
      } catch {
        // ignore
      }
      setStatus("done");
    } catch {
      setError(true);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="feedback-widget">
        <p className="feedback-success">{t("success")}</p>
      </div>
    );
  }

  return (
    <div className="feedback-widget">
      <div className="feedback-question">
        <span>{t("question")}</span>
        <div className="feedback-buttons">
          <button
            type="button"
            className={`feedback-btn${selected === "up" ? " selected" : ""}`}
            onClick={() => setSelected("up")}
          >
            {t("up")}
          </button>
          <button
            type="button"
            className={`feedback-btn${selected === "down" ? " selected" : ""}`}
            onClick={() => setSelected("down")}
          >
            {t("down")}
          </button>
        </div>
      </div>
      {selected ? (
        <div className="feedback-comment">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={selected === "up" ? t("placeholderUp") : t("placeholderDown")}
            rows={3}
            maxLength={2000}
          />
          <button
            type="button"
            className="feedback-submit-btn"
            disabled={status === "submitting"}
            onClick={submit}
          >
            {status === "submitting" ? t("submitting") : t("submit")}
          </button>
          {error ? <p className="feedback-error">{t("error")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
