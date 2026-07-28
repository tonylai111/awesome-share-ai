type Props = {
  name: "claude" | "agent" | "codex" | "quant";
  accent: string;
};

export function GuideIcon({ name, accent }: Props) {
  if (name === "claude") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="14" fill={accent} opacity="0.15" />
        <path
          d="M8 20c2-6 5-10 8-10s6 4 8 10"
          stroke={accent}
          strokeWidth="2"
          fill="none"
        />
        <circle cx="12" cy="14" r="1.5" fill={accent} />
        <circle cx="20" cy="14" r="1.5" fill={accent} />
      </svg>
    );
  }

  if (name === "codex") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect x="4" y="8" width="24" height="16" rx="3" fill={accent} opacity="0.15" />
        <path
          d="M10 16h4M18 13v6M22 16h-2"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "quant") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <path
          d="M6 22l6-8 5 4 9-12"
          stroke={accent}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="26" cy="6" r="2" fill={accent} />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <path
        d="M16 4l2 6h6l-5 4 2 6-5-3-5 3 2-6-5-4h6z"
        fill={accent}
        opacity="0.85"
      />
    </svg>
  );
}
