import { Category, CampusLocation } from "@/generated/prisma/enums";

/**
 * Parse feed filters out of the query string.
 *
 * Unknown values are dropped rather than rejected: a stale or hand-edited URL
 * should quietly show an unfiltered feed, not an error page. Prisma would
 * throw on an invalid enum, so this is also what keeps a crafted ?category=
 * from producing a 500.
 */
export function parseFeedParams(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const category = one("category");
  const location = one("location");
  const query = one("q")?.trim();
  const page = Number.parseInt(one("page") ?? "1", 10);

  return {
    filters: {
      category: isCategory(category) ? category : undefined,
      location: isLocation(location) ? location : undefined,
      query: query || undefined,
    },
    page: Number.isFinite(page) && page > 1 ? page - 1 : 0,
  };
}

function isCategory(value?: string): value is Category {
  return Boolean(value && value in Category);
}

function isLocation(value?: string): value is CampusLocation {
  return Boolean(value && value in CampusLocation);
}
