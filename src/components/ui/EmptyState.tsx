import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-raised px-6 py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && (
        <div className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {children}
        </div>
      )}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}
