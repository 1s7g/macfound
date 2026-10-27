import Link from "next/link";

import { FeedEmpty, type FeedFiltersValue, type FeedResult } from "@/components/Feed";
import { MobileFeedFilters } from "@/components/mobile/MobileFeedFilters";
import { MobilePostRow } from "@/components/mobile/MobilePostRow";
import { Badge } from "@/components/ui";
import { FEED_PAGE_SIZE } from "@/lib/posts";
import type { PostType } from "@/generated/prisma/enums";

/** The phone board: search, chips, and a list of cards sized for a thumb. */
export function MobileFeed({
  type,
  basePath,
  filters,
  page,
  feed,
}: {
  type?: PostType;
  basePath: string;
  filters: FeedFiltersValue;
  page: number;
  feed: FeedResult;
}) {
  const { posts, total } = feed;
  const hasFilters = Boolean(filters.category || filters.location || filters.query);
  const lastPage = Math.max(0, Math.ceil(total / FEED_PAGE_SIZE) - 1);

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    if (target > 0) params.set("page", String(target + 1));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="px-4 pt-3 pb-4">
      <MobileFeedFilters
        basePath={basePath}
        category={filters.category}
        location={filters.location}
        query={filters.query}
      />

      <p className="mt-4 mb-2.5 text-sm text-muted">
        {total === 1 ? "1 item" : `${total} items`}
        {hasFilters && (
          <>
            {" · "}
            <Link href={basePath} className="font-medium text-brand-text">
              Clear
            </Link>
          </>
        )}
      </p>

      {posts.length === 0 ? (
        <FeedEmpty type={type} hasFilters={hasFilters} basePath={basePath} />
      ) : (
        <ul className="space-y-2.5">
          {posts.map((post) => (
            <li key={post.id}>
              <MobilePostRow
                post={post}
                extra={post.handedInAt && <Badge tone="brand">At Campus Safety</Badge>}
              />
            </li>
          ))}
        </ul>
      )}

      {lastPage > 0 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          {page > 0 ? (
            <Link href={pageHref(page - 1)} className="py-2 font-medium text-brand-text">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            {page + 1} / {lastPage + 1}
          </span>
          {page < lastPage ? (
            <Link href={pageHref(page + 1)} className="py-2 font-medium text-brand-text">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
