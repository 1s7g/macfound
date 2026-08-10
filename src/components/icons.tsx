import type { ReactNode } from "react";

/**
 * Header glyphs.
 *
 * Shared so the loading header can draw the same icons as the real one. They
 * depend on no data, so blanking them out while a page loads would make the
 * header visibly flicker on every navigation for no reason — only the unread
 * badges and the avatar letter actually need a query.
 */

export function NavGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      {children}
    </svg>
  );
}

export function MessagesGlyph() {
  return <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;
}

export function BellGlyph() {
  return (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  );
}

export function ReportsGlyph() {
  return (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  );
}
