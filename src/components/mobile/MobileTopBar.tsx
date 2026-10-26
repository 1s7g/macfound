import Link from "next/link";

import { ChevronLeftGlyph, Icon, ReportsGlyph } from "@/components/icons";

/**
 * The phone's top bar. Deliberately nearly empty: navigation lives in the tab
 * bar at the bottom, so up here is just where you are — the wordmark on top-level
 * pages, a back link on pages you drill into.
 */
export function MobileTopBar({
  back,
  openReports,
}: {
  back?: { href: string; label: string };
  /** Moderators only; undefined hides the link entirely. */
  openReports?: number;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md md:hidden">
      <div className="flex h-12 items-center gap-2 px-4">
        {back ? (
          <Link
            href={back.href}
            className="-ml-2 flex h-10 items-center gap-1 rounded-control pr-3 pl-1 text-[15px] font-medium text-ink"
          >
            <Icon className="h-5 w-5">
              <ChevronLeftGlyph />
            </Icon>
            {back.label}
          </Link>
        ) : (
          <Link href="/browse" className="text-[17px] font-semibold tracking-tight text-ink">
            MacFound
          </Link>
        )}

        {openReports !== undefined && (
          <Link
            href="/admin/reports"
            aria-label={`Reports${openReports > 0 ? ` (${openReports})` : ""}`}
            className="relative ml-auto flex h-10 w-10 items-center justify-center text-muted"
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
    </header>
  );
}
