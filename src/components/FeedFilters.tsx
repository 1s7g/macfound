import Link from "next/link";

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
    <form method="GET" action={basePath} className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search titles and descriptions…"
          aria-label="Search posts"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />

        <select
          name="category"
          defaultValue={category ?? ""}
          aria-label="Filter by category"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>

        <select
          name="location"
          defaultValue={location ?? ""}
          aria-label="Filter by location"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Anywhere on campus</option>
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

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Filter
          </button>
          {hasFilters && (
            <Link
              href={basePath}
              className="flex items-center rounded-lg px-3 py-2 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              Clear
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
