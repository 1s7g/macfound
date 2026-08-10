import Link from "next/link";

import { Button, Select } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABELS, LOCATION_GROUPS, LOCATION_LABELS } from "@/lib/vocabulary";
import type { Category, CampusLocation } from "@/generated/prisma/enums";

/**
 * Feed filters as a plain GET form.
 *
 * Submitting navigates to the same route with query parameters, so filter state
 * lives in the URL: shareable, back-button friendly, and working before (or
 * without) any JavaScript. Native <select> also gets the OS picker on mobile,
 * which beats any custom dropdown for a 46-item location list.
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
    <form method="GET" action={basePath} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="search"
        name="q"
        defaultValue={query ?? ""}
        placeholder="Search titles and descriptions…"
        aria-label="Search posts"
        className="h-10 min-w-0 flex-1 rounded-control border border-line-strong bg-raised px-3.5 text-sm text-ink transition-colors placeholder:text-subtle focus:border-brand focus:outline-none"
      />

      <Select
        name="category"
        defaultValue={category ?? ""}
        aria-label="Filter by category"
        className="sm:w-44 text-sm"
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
        className="sm:w-48 text-sm"
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

      <div className="flex gap-2">
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {hasFilters && (
          <Link
            href={basePath}
            className="flex items-center rounded-control px-3 text-sm text-subtle transition-colors hover:bg-sunken hover:text-ink"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
