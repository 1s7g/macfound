import type { ReactNode } from "react";

/**
 * The heading row every top-level page opens with.
 *
 * Pages used to size their own h1 — text-title on the boards, text-xl
 * everywhere else — so moving between tabs made the title jump. One component,
 * one size.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-title font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-subtle">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
