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

// --- Phone navigation ------------------------------------------------------

export function SearchGlyph() {
  return (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  );
}

export function PlusGlyph() {
  return <path d="M12 5v14M5 12h14" />;
}

export function UserGlyph() {
  return (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </>
  );
}

export function ChevronLeftGlyph() {
  return <path d="m15 18-6-6 6-6" />;
}

export function XGlyph() {
  return <path d="M18 6 6 18M6 6l12 12" />;
}

// --- Categories --------------------------------------------------------------
//
// One glyph per category, drawn where a post has no photo. An empty grey square
// says "nothing here"; a backpack outline says what the post is about before the
// title has been read.

function ElectronicsGlyph() {
  return (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  );
}

function BagGlyph() {
  return (
    <>
      <path d="M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M9 22v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5" />
    </>
  );
}

function BottleGlyph() {
  return (
    <>
      <path d="M9 2h6" />
      <path d="M10 2v3l-2 3v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-2-3V2" />
      <path d="M8 13h8" />
    </>
  );
}

function KeyGlyph() {
  return (
    <>
      <circle cx="7.5" cy="15.5" r="5" />
      <path d="m11 12 10-10" />
      <path d="m16 7 3 3" />
    </>
  );
}

function ShirtGlyph() {
  return (
    <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z" />
  );
}

function GemGlyph() {
  return (
    <>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M2 9h20" />
      <path d="m11 3-3 6 4 13 4-13-3-6" />
    </>
  );
}

function BookGlyph() {
  return (
    <>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </>
  );
}

function BallGlyph() {
  return (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15 15 0 0 0 0 20 15 15 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  );
}

function GlassesGlyph() {
  return (
    <>
      <circle cx="6" cy="15" r="4" />
      <circle cx="18" cy="15" r="4" />
      <path d="M14 15a2 2 0 0 0-4 0" />
      <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2" />
      <path d="M21.5 13 19 7c-.7-1.3-1.4-2-3-2" />
    </>
  );
}

function BoxGlyph() {
  return (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  );
}

const CATEGORY_GLYPHS = {
  ELECTRONICS: ElectronicsGlyph,
  BAGS: BagGlyph,
  WATER_BOTTLE: BottleGlyph,
  KEYS_AND_CARDS: KeyGlyph,
  CLOTHING: ShirtGlyph,
  JEWELLERY: GemGlyph,
  BOOKS_AND_NOTES: BookGlyph,
  SPORTS_EQUIPMENT: BallGlyph,
  EYEWEAR: GlassesGlyph,
  OTHER: BoxGlyph,
} as const;

export function CategoryIcon({
  category,
  className = "h-6 w-6",
}: {
  category: keyof typeof CATEGORY_GLYPHS;
  className?: string;
}) {
  const Glyph = CATEGORY_GLYPHS[category];
  return (
    <Icon className={className}>
      <Glyph />
    </Icon>
  );
}

export function ChevronDownGlyph() {
  return <path d="m6 9 6 6 6-6" />;
}

export function CheckGlyph() {
  return <path d="M20 6 9 17l-5-5" />;
}
