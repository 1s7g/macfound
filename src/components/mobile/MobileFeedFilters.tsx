"use client";

import Link from "next/link";

import { ChevronDownGlyph, Icon, SearchGlyph } from "@/components/icons";
import { CATEGORIES, CATEGORY_LABELS, LOCATION_GROUPS, LOCATION_LABELS } from "@/lib/vocabulary";
import type { Category, CampusLocation } from "@/generated/prisma/enums";

const BOARDS = [
  { path: "/browse", label: "All" },
  { path: "/lost", label: "Lost" },
  { path: "/found", label: "Found" },
] as const;

/**
 * Search and filters for the phone.
 *
 * Lost / Found is a switch rather than separate tabs in the header: they're a
 * filter on one list, not two different places. A search for "water bottle"
 * starts on All, so a match on the other board isn't missed just because you
 * started on the wrong one. Category and place sit side by side at half width
 * each — in one sideways-scrolling row with the board chips they ran off the
 * edge of the screen. Both are native selects: the phone's own picker is the
 * best UI there is for a 46-item list.
 */
export function MobileFeedFilters({
  basePath,
  category,
  location,
  query,
}: {
  basePath: string;
  category?: Category;
  location?: CampusLocation;
  query?: string;
}) {
  const carry = (path: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  // Shared by the two pickers: a select dressed as a field, with its own chevron
  // since appearance-none removes the native one.
  const picker = (active: boolean) =>
    `h-10 w-full appearance-none truncate rounded-control border bg-raised pr-8 pl-3 text-sm font-medium ${
      active ? "border-brand-border text-brand-text" : "border-line-strong text-ink"
    }`;

  return (
    <form
      method="GET"
      action={basePath}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit();
      }}
      className="space-y-2.5"
    >
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-muted">
          <SearchGlyph />
        </Icon>
        {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
        <input
          type="search"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search items or places"
          enterKeyHint="search"
          className="h-11 w-full rounded-full border border-line-strong bg-raised pr-4 pl-11 text-base text-ink placeholder:text-subtle"
        />
      </label>

      {/* A three-way switch the width of the screen: which board, at a glance. */}
      <nav aria-label="Board" className="grid grid-cols-3 rounded-full bg-sunken p-1">
        {BOARDS.map((board) => {
          const active = board.path === basePath;
          return (
            <Link
              key={board.path}
              href={carry(board.path)}
              aria-current={active ? "page" : undefined}
              className={`flex h-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                active ? "bg-raised text-ink shadow-card" : "text-muted"
              }`}
            >
              {board.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid grid-cols-2 gap-2">
        <label className="relative block min-w-0">
          <span className="sr-only">Category</span>
          <select name="category" defaultValue={category ?? ""} className={picker(Boolean(category))}>
            <option value="">Any category</option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
          <Chevron />
        </label>

        <label className="relative block min-w-0">
          <span className="sr-only">Place</span>
          <select name="location" defaultValue={location ?? ""} className={picker(Boolean(location))}>
            <option value="">Anywhere</option>
            {LOCATION_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.locations.map((value) => (
                  <option key={value} value={value}>
                    {LOCATION_LABELS[value]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Chevron />
        </label>
      </div>

      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}

function Chevron() {
  return (
    <Icon className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted">
      <ChevronDownGlyph />
    </Icon>
  );
}
