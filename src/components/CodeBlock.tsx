"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = React.ComponentProps<"pre">;

export function CodeBlock({ children, ...props }: Props) {
  const t = useTranslations("code");
  const preRef = useRef<HTMLPreElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = preRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const canScroll = max > 2;
      setOverflow(canScroll);
      setAtStart(el.scrollLeft <= 2);
      setAtEnd(!canScroll || el.scrollLeft >= max - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const showHint = overflow && !atEnd;

  return (
    <div
      className="code-frame"
      data-overflow={overflow ? "true" : "false"}
      data-at-start={atStart ? "true" : "false"}
      data-at-end={atEnd ? "true" : "false"}
    >
      <pre {...props} ref={preRef} tabIndex={overflow ? 0 : undefined}>
        {children}
      </pre>
      {showHint ? (
        <span className="code-scroll-hint" aria-hidden="true">
          {t("scrollHint")}
        </span>
      ) : null}
    </div>
  );
}
