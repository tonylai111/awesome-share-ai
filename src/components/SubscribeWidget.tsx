"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function SubscribeWidget() {
  const t = useTranslations("subscribe");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("email_subscribed")) {
        setStatus("done");
      }
    } catch {
      // ignore
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || status === "submitting") return;
    setStatus("submitting");
    setError(false);
    try {
      const res = await fetch("/api/feishu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscribe",
          email: value,
          pageUrl: window.location.href,
          pageTitle: document.title,
        }),
      });
      if (!res.ok) throw new Error("failed");
      try {
        localStorage.setItem("email_subscribed", value);
      } catch {
        // ignore
      }
      setStatus("done");
    } catch {
      setError(true);
      setStatus("idle");
    }
  }

  return (
    <div className="subscribe-widget">
      <h3>{t("title")}</h3>
      <p>{t("blurb")}</p>
      {status === "done" ? (
        <p className="subscribe-success">{t("success")}</p>
      ) : (
        <form className="subscribe-form" onSubmit={onSubmit}>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            required
            autoComplete="email"
          />
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? t("submitting") : t("submit")}
          </button>
        </form>
      )}
      {error ? <p className="subscribe-error">{t("error")}</p> : null}
    </div>
  );
}
