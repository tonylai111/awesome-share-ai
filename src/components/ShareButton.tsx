"use client";

import { useState } from "react";

type Props = {
  title: string;
  label: string;
  copiedLabel: string;
};

export function ShareButton({ title, label, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      className="share-btn"
      onClick={onShare}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
