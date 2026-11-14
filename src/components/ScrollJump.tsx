"use client";

import { useEffect, useState } from "react";

type Props = {
  toBottom: string;
  toTop: string;
  /** Page must be taller than this many viewports before the control appears. */
  minViewports?: number;
};

const NARROW = "(max-width: 560px)";

/** Distance from the viewport bottom to the top of the mobile control. */
function jumpClearance() {
  const root =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;";
  document.body.appendChild(probe);
  const safe = parseFloat(getComputedStyle(probe).bottom) || 0;
  probe.remove();
  return (1 + 0.7 * 2 + 0.95) * root + 2 + safe;
}

function articleEndCovered(clearance: number) {
  const last = document.querySelector(".article-body")?.lastElementChild;
  if (!last) return false;
  const rect = last.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  const buttonTop = window.innerHeight - clearance;
  return rect.top < window.innerHeight && rect.bottom > buttonTop;
}

export function ScrollJump({
  toBottom,
  toTop,
  minViewports = 2.2,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia(NARROW);
    let clearance = jumpClearance();

    function update() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const longEnough = doc.scrollHeight > window.innerHeight * minViewports;
      const remaining = scrollable - window.scrollY;
      const covered = narrow.matches && articleEndCovered(clearance);
      setVisible(longEnough && scrollable > 80 && !covered);
      setNearBottom(remaining < window.innerHeight * 0.55);
    }

    function onResize() {
      clearance = jumpClearance();
      update();
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    narrow.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
      narrow.removeEventListener("change", onResize);
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
