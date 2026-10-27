"use client";

import Link from "next/link";

import { Input, Select } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABELS, LOCATION_GROUPS, LOCATION_LABELS } from "@/lib/vocabulary";
import type { Category, CampusLocation } from "@/generated/prisma/enums";

/**
 * Feed filters as a plain GET form.
 *
 * Submitting navigates to the same route with query parameters, so filter state
 * lives in the URL: shareable, back-button friendly, and working before (or
 * without) any JavaScript. Native <select> also gets the OS picker on mobile,
 * which beats any custom dropdown for a 46-item location list.
 *
 * Picking a category or building applies it straight away; search applies on
 * Enter. A separate "Filter" button made every change a two-step job. It's
 * still there for screen readers and for anyone without JavaScript.
 */
export function FeedFilters({
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
  const hasFilters = Boolean(category || location || query);

  return (
    <form
      method="GET"
      action={basePath}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit();
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <Input
        type="search"
        name="q"
        defaultValue={query ?? ""}
        placeholder="Search items, places, categories…"
        aria-label="Search posts"
        className="min-w-0 flex-1 text-sm"
      />

      <div className="flex gap-2">
        <Select
          name="category"
          defaultValue={category ?? ""}
          aria-label="Filter by category"
          className="min-w-0 flex-1 text-sm sm:w-44 sm:flex-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </Select>

        <Select
          name="location"
          defaultValue={location ?? ""}
          aria-label="Filter by location"
          className="min-w-0 flex-1 text-sm sm:w-48 sm:flex-none"
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
        </Select>
      </div>

      <button type="submit" className="sr-only">
        Apply filters
      </button>

      {hasFilters && (
        <Link
          href={basePath}
          className="flex items-center justify-center rounded-control px-3 py-2 text-sm text-subtle transition-colors hover:bg-sunken hover:text-ink"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
