import type { ComponentProps, ReactNode } from "react";

/**
 * The icon set.
 *
 * Glyphs are exported as bare path data and drawn by <Icon>, so a caller picks
 * the size and colour and every icon shares one set of stroke settings. Two
 * icons drawn at different stroke widths look like two different icon sets,
 * which is the usual way a hand-rolled set starts to look homemade.
 *
 * They are shared rather than inlined so the loading header can draw the same
 * icons as the real one — see components/Skeleton.tsx.
 */

export function Icon({
  children,
  className = "h-4 w-4",
  ...props
}: ComponentProps<"svg"> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      // shrink-0 because these sit beside text in flex rows, where an icon that
      // squashes is worse than one that wraps.
      className={`shrink-0 ${className}`}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Header-sized wrapper, kept so the nav and its skeleton stay identical. */
export function NavGlyph({ children }: { children: ReactNode }) {
  return <Icon className="h-[18px] w-[18px]">{children}</Icon>;
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

export function PinGlyph() {
  return (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  );
}

export function CalendarGlyph() {
  return (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  );
}

export function TagGlyph() {
  return (
    <>
      <path d="M16 20V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v14" />
      <rect x="2" y="7" width="20" height="14" rx="2" />
    </>
  );
}

export function InfoGlyph() {
  return (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  );
}

export function ClockGlyph() {
  return (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  );
}

export function FlagGlyph() {
  return (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </>
  );
}

export function SendGlyph() {
  return (
    <>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </>
  );
}

export function ChevronRightGlyph() {
  return <path d="m9 18 6-6-6-6" />;
}
