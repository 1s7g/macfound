import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronLeftGlyph, Icon, ReportsGlyph } from "@/components/icons";

/**
 * The phone's top bar. Navigation lives in the tab bar at the bottom, so up here
 * is just where you are: the wordmark on Browse, the page's own name on the
 * other tabs, and a back arrow on pages you drill into. A page's one action
 * ("Mark all read") sits on the right, where the title can't crowd it.
 *
 * The page name lives here rather than as a heading under it — a wordmark bar
 * stacked above a 24px "Messages" spent a fifth of the screen saying where you
 * were twice.
 */
export function MobileTopBar({
  back,
  title,
  action,
  openReports,
}: {
  back?: { href: string; label: string };
  title?: string;
  action?: ReactNode;
  /** Moderators only; undefined hides the link entirely. */
  openReports?: number;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md md:hidden">
      <div className="flex h-13 items-center gap-1 px-4">
        {back && (
          <Link
            href={back.href}
            aria-label={title ? `Back to ${back.label}` : undefined}
            className="-ml-2 flex h-10 shrink-0 items-center gap-0.5 rounded-control pr-2 pl-1 text-[15px] font-medium text-ink"
          >
            <Icon className="h-6 w-6">
              <ChevronLeftGlyph />
            </Icon>
            {!title && back.label}
          </Link>
        )}

        {title ? (
          <h1 className="min-w-0 truncate text-[17px] font-semibold tracking-tight text-ink">
            {title}
          </h1>
        ) : (
          !back && (
            <Link href="/browse" className="text-[17px] font-semibold tracking-tight text-ink">
              MacFound
            </Link>
          )
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {action}
          {openReports !== undefined && (
            <Link
              href="/admin/reports"
              aria-label={`Reports${openReports > 0 ? ` (${openReports})` : ""}`}
              className="relative -mr-2 flex h-10 w-10 items-center justify-center text-muted"
            >
              <Icon className="h-5 w-5">
                <ReportsGlyph />
              </Icon>
              {openReports > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                  {openReports > 9 ? "9+" : openReports}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
