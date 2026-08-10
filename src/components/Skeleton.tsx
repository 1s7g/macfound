import Link from "next/link";

import { BellGlyph, MessagesGlyph, NavGlyph } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Loading placeholders.
 *
 * Every page here queries the database before it can render anything, and the
 * Header adds two more queries on top. Without a loading state a navigation
 * looks like nothing happened until the whole thing arrives at once.
 *
 * The shapes deliberately match the real content's dimensions, so nothing
 * shifts when it swaps in. Sizes that don't line up are worse than no skeleton
 * at all — the jump reads as a bug.
 *
 * globals.css already collapses animation under prefers-reduced-motion, so the
 * pulse needs no special handling here.
 */

/*
 * Note: the <main> elements below deliberately carry no id="main".
 *
 * A Suspense fallback and the real content coexist in the DOM while React
 * streams, so putting the skip link's target id on both would duplicate it —
 * and querySelector("#main") takes the first in document order, which during
 * that window is the zero-height fallback. The skip link would quietly jump
 * nowhere. The fallback is transient; it doesn't need to be a skip target.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-sunken ${className}`} />;
}

/**
 * A stand-in for the real header.
 *
 * Draws the real wordmark, board switch and icons rather than grey blocks, and
 * is never deferred — the header has to stay put while the content below it
 * swaps, or every navigation blinks the whole page chrome. Nothing here needs a
 * query; only the unread badges and the avatar's letter do, and those are
 * simply left off. The result is close enough to the real header that the swap
 * isn't visible.
 */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-4xl items-center gap-2 px-4">
        <Link href="/lost" className="mr-1 text-[15px] font-semibold tracking-tight text-ink">
          MacFound
        </Link>
        <div className="flex rounded-control bg-sunken p-0.5 text-sm">
          <span className="rounded-[calc(var(--radius-control)-0.15rem)] px-3 py-1 font-medium text-muted">
            Lost
          </span>
          <span className="rounded-[calc(var(--radius-control)-0.15rem)] px-3 py-1 font-medium text-muted">
            Found
          </span>
        </div>
        {/* aria-hidden sits on the decorative pieces individually, not on the
            wrapper: the toggle inside is focusable, and hiding a focusable
            element from assistive tech while leaving it tabbable strands anyone
            navigating by keyboard on a control their screen reader won't
            announce. */}
        <div className="ml-auto flex items-center gap-0.5">
          <span aria-hidden className="flex h-8 w-8 items-center justify-center text-muted">
            <NavGlyph>
              <MessagesGlyph />
            </NavGlyph>
          </span>
          <span aria-hidden className="flex h-8 w-8 items-center justify-center text-muted">
            <NavGlyph>
              <BellGlyph />
            </NavGlyph>
          </span>
          {/* The real toggle, not a placeholder — it reads the theme off <html>
              and needs no query, so leaving it out would shift the icons beside
              it every time a page loaded. */}
          <ThemeToggle />
          <span aria-hidden className="ml-1.5 h-7 w-7 rounded-full bg-brand" />
        </div>
      </div>
    </header>
  );
}

/** A feed row, matching PostCard's 64px thumbnail and two lines of text. */
export function PostCardSkeleton() {
  return (
    <li className="flex gap-4 rounded-card border border-line bg-raised p-4 shadow-card">
      <Skeleton className="h-16 w-16 shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </li>
  );
}

/** The shared shape of /lost and /found while their queries run. */
export function FeedSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <main className="deferred-skeleton mx-auto w-full max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24 rounded-control" />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-control" />
          <Skeleton className="h-10 rounded-control sm:w-44" />
          <Skeleton className="h-10 rounded-control sm:w-48" />
          <Skeleton className="h-10 w-20 rounded-control" />
        </div>

        <ul className="mt-5 space-y-2.5">
          {Array.from({ length: 5 }, (_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </ul>
      </main>
    </>
  );
}

/** A stack of card-shaped rows, for the list pages. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      <HeaderSkeleton />
      <main className="deferred-skeleton mx-auto w-full max-w-4xl px-4 py-6">
        <Skeleton className="h-7 w-40" />
        <ul className="mt-5 space-y-2.5">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="rounded-card border border-line bg-raised p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
