import Link from "next/link";

import { FeedEmpty, type FeedFiltersValue, type FeedResult } from "@/components/Feed";
import { formatDay } from "@/components/PostCard";
import { CategoryIcon } from "@/components/icons";
import { MobileFeedFilters } from "@/components/mobile/MobileFeedFilters";
import { Badge } from "@/components/ui";
import { FEED_PAGE_SIZE } from "@/lib/posts";
import { LOCATION_LABELS } from "@/lib/vocabulary";
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

      <p className="mt-4 mb-2 text-sm text-muted">
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
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.id}`}
                className="flex items-center gap-3 rounded-card border border-line bg-raised p-3 active:bg-sunken"
              >
                {post.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.images[0].url}
                    alt=""
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-[10px] object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-sunken text-muted"
                  >
                    <CategoryIcon category={post.category} className="h-7 w-7" />
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[15px] leading-snug font-medium text-ink">
                    {post.title}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2 text-sm text-muted">
                    {/* Only on the mixed list — on Lost or Found every row would say the same thing. */}
                    {!type && (
                      <span className="shrink-0">
                        <Badge tone={post.type === "FOUND" ? "found" : "lost"}>
                          {post.type === "FOUND" ? "Found" : "Lost"}
                        </Badge>
                      </span>
                    )}
                    <span className="min-w-0 truncate">
                      {LOCATION_LABELS[post.location]} · {formatDay(post.occurredOn)}
                    </span>
                  </span>
                  {post.handedInAt && (
                    <span className="mt-1.5 block">
                      <Badge tone="brand">At Campus Safety</Badge>
                    </span>
                  )}
                </span>
              </Link>
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
