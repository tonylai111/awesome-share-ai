"use client";

import { useEffect, useState } from "react";

type Props = {
  toBottom: string;
  toTop: string;
  /** Page must be taller than this many viewports before the control appears. */
  minViewports?: number;
};

export function ScrollJump({
  toBottom,
  toTop,
  minViewports = 2.2,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    function update() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const longEnough = doc.scrollHeight > window.innerHeight * minViewports;
      setVisible(longEnough && scrollable > 80);

      const remaining = scrollable - window.scrollY;
      setNearBottom(remaining < window.innerHeight * 0.55);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [minViewports]);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-jump"
      aria-label={nearBottom ? toTop : toBottom}
      title={nearBottom ? toTop : toBottom}
      onClick={() => {
        window.scrollTo({
          top: nearBottom ? 0 : document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      }}
    >
      <span className="scroll-jump-arrow" aria-hidden>
        {nearBottom ? "↑" : "↓"}
      </span>
      <span className="scroll-jump-label">
        {nearBottom ? toTop : toBottom}
      </span>
    </button>
  );
}
