import Link from "next/link";

import { FeedFilters } from "@/components/FeedFilters";
import { PostCard } from "@/components/PostCard";
import { ButtonLink, EmptyState } from "@/components/ui";
import { CAMPUS_SAFETY } from "@/lib/campus-safety";
import { FEED_PAGE_SIZE, getFeed } from "@/lib/posts";
import type { Category, CampusLocation, PostType } from "@/generated/prisma/enums";

/**
 * One side of the board. Shared by /lost and /found — the two differ only in
 * copy and which post type they query, and duplicating the whole page to change
 * three strings would guarantee they drift apart.
 */
export async function Feed({
  type,
  basePath,
  filters,
  page,
}: {
  type: PostType;
  basePath: string;
  filters: { category?: Category; location?: CampusLocation; query?: string };
  page: number;
}) {
  const { posts, total } = await getFeed(type, filters, page);
  const isLost = type === "LOST";
  const hasFilters = Boolean(filters.category || filters.location || filters.query);
  const lastPage = Math.max(0, Math.ceil(total / FEED_PAGE_SIZE) - 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-semibold text-ink">
            {isLost ? "Lost items" : "Found items"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isLost
              ? "Things people are looking for. Recognise something? Say so."
              : "Things people have picked up. See yours? Claim it."}
          </p>
        </div>

        <ButtonLink
          href={`/posts/new?type=${isLost ? "lost" : "found"}`}
          className="shrink-0"
        >
          {isLost ? "I lost something" : "I found something"}
        </ButtonLink>
      </div>

      <FeedFilters
        basePath={basePath}
        category={filters.category}
        location={filters.location}
        query={filters.query}
      />

      {posts.length === 0 ? (
        <FeedEmpty isLost={isLost} hasFilters={hasFilters} basePath={basePath} />
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">
            {total} open {total === 1 ? "post" : "posts"}
          </p>
          <ul className="space-y-2.5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ul>
          {lastPage > 0 && (
            <Pagination basePath={basePath} filters={filters} page={page} lastPage={lastPage} />
          )}
        </>
      )}
    </div>
  );
}

function FeedEmpty({
  isLost,
  hasFilters,
  basePath,
}: {
  isLost: boolean;
  hasFilters: boolean;
  basePath: string;
}) {
  if (hasFilters) {
    return (
      <EmptyState
        title="Nothing matches those filters."
        action={
          <ButtonLink href={basePath} variant="secondary">
            Clear filters
          </ButtonLink>
        }
      />
    );
  }

  return (
    <EmptyState
      title={isLost ? "Nothing reported lost right now." : "Nothing handed in here yet."}
      action={
        <ButtonLink href={`/posts/new?type=${isLost ? "lost" : "found"}`}>
          {isLost ? "Report a lost item" : "Post a found item"}
        </ButtonLink>
      }
    >
      {isLost ? (
        <>
          Lost something? Post it — and check {CAMPUS_SAFETY.name} at{" "}
          {CAMPUS_SAFETY.building}, where items are held for{" "}
          {CAMPUS_SAFETY.retentionDays} days.
        </>
      ) : (
        <>
          Found something? Post it here, or drop it at one of the official boxes —{" "}
          {CAMPUS_SAFETY.name} keeps items for {CAMPUS_SAFETY.retentionDays} days.
        </>
      )}
    </EmptyState>
  );
}

function Pagination({
  basePath,
  filters,
  page,
  lastPage,
}: {
  basePath: string;
  filters: { category?: Category; location?: CampusLocation; query?: string };
  page: number;
  lastPage: number;
}) {
  const href = (target: number) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    if (target > 0) params.set("page", String(target + 1));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      className="flex items-center justify-between border-t border-line pt-4"
      aria-label="Pagination"
    >
      {page > 0 ? (
        <Link href={href(page - 1)} className="text-sm font-medium text-brand-text hover:underline">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-subtle">
        Page {page + 1} of {lastPage + 1}
      </span>
      {page < lastPage ? (
        <Link href={href(page + 1)} className="text-sm font-medium text-brand-text hover:underline">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
