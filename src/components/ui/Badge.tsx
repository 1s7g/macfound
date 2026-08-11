import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "lost"
  | "found"
  | "resolved"
  | "danger"
  | "brand";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-muted",
  lost: "bg-warning-subtle text-warning",
  found: "bg-success-subtle text-success",
  resolved: "bg-brand text-on-brand",
  danger: "bg-danger-subtle text-danger",
  brand: "bg-brand-subtle text-brand-text",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      // gap so a badge can carry a leading icon or status dot without the
      // caller hand-spacing it.
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Small count bubble for nav items. */
export function CountBadge({ count, tone = "brand" }: { count: number; tone?: "brand" | "danger" }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
        tone === "danger" ? "bg-danger text-white" : "bg-brand text-on-brand"
      }`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
