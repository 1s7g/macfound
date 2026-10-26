"use client";

import Link from "next/link";

import { Icon, SearchGlyph } from "@/components/icons";
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
 * Lost / Found are chips rather than separate tabs in the header: they're a
 * filter on one list, not two different places. A search for "water bottle"
 * starts on All, so a match on the other board isn't missed just because you
 * started on the wrong one. Category and place are pill-shaped native selects —
 * the phone's own picker is the best UI there is for a 46-item list.
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

  const pill =
    "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors";

  return (
    <form
      method="GET"
      action={basePath}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit();
      }}
      className="space-y-3"
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

      {/* One row that scrolls sideways rather than wrapping onto a second. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
        {BOARDS.map((board) => {
          const active = board.path === basePath;
          return (
            <Link
              key={board.path}
              href={carry(board.path)}
              aria-current={active ? "page" : undefined}
              className={`${pill} flex items-center ${
                active
                  ? "border-transparent bg-inverse text-ink-inverse"
                  : "border-line-strong bg-raised text-ink"
              }`}
            >
              {board.label}
            </Link>
          );
        })}

        <span aria-hidden className="w-px shrink-0 self-stretch bg-line" />

        <select
          name="category"
          defaultValue={category ?? ""}
          aria-label="Category"
          className={`${pill} max-w-44 appearance-none bg-raised ${
            category ? "border-brand-border text-brand-text" : "border-line-strong text-ink"
          }`}
        >
          <option value="">Any category</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>

        <select
          name="location"
          defaultValue={location ?? ""}
          aria-label="Place"
          className={`${pill} max-w-44 appearance-none bg-raised ${
            location ? "border-brand-border text-brand-text" : "border-line-strong text-ink"
          }`}
        >
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
      </div>

      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
