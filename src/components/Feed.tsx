import Link from "next/link";

import { FeedFilters } from "@/components/FeedFilters";
import { PostCard } from "@/components/PostCard";
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
    <div className="space-y-4">
      {/* Stacked on phones: side by side, the button squeezes the subtitle into
          three ragged lines. Full-width below it reads better and is an easier
          tap target. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            {isLost ? "Lost items" : "Found items"}
          </h1>
          <p className="mt-0.5 text-sm text-stone-500">
            {isLost
              ? "Things people are looking for. Recognise something? Say so."
              : "Things people have picked up. See yours? Claim it."}
          </p>
        </div>

        <Link
          href={`/posts/new?type=${isLost ? "lost" : "found"}`}
          className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-dark sm:py-2"
        >
          {isLost ? "I lost something" : "I found something"}
        </Link>
      </div>

      <FeedFilters
        basePath={basePath}
        category={filters.category}
        location={filters.location}
        query={filters.query}
      />

      {posts.length === 0 ? (
        <EmptyState isLost={isLost} hasFilters={hasFilters} basePath={basePath} />
      ) : (
        <>
          <p className="text-sm text-stone-500">
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

function EmptyState({
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
      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <p className="text-stone-700">Nothing matches those filters.</p>
        <Link
          href={basePath}
          className="mt-2 inline-block text-sm font-medium text-brand underline underline-offset-2"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="text-stone-700">
        {isLost ? "Nothing reported lost right now." : "Nothing handed in here yet."}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
        {isLost ? (
          <>
            Lost something? Post it — and check {CAMPUS_SAFETY.name} at{" "}
            {CAMPUS_SAFETY.building}, where items are held for{" "}
            {CAMPUS_SAFETY.retentionDays} days.
          </>
        ) : (
          <>
            Found something? Post it here, or drop it at one of the official
            boxes — {CAMPUS_SAFETY.name} keeps items for{" "}
            {CAMPUS_SAFETY.retentionDays} days.
          </>
        )}
      </p>
      <Link
        href={`/posts/new?type=${isLost ? "lost" : "found"}`}
        className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        {isLost ? "Report a lost item" : "Post a found item"}
      </Link>
    </div>
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
    <nav className="flex items-center justify-between pt-2" aria-label="Pagination">
      {page > 0 ? (
        <Link href={href(page - 1)} className="text-sm font-medium text-brand hover:underline">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-stone-500">
        Page {page + 1} of {lastPage + 1}
      </span>
      {page < lastPage ? (
        <Link href={href(page + 1)} className="text-sm font-medium text-brand hover:underline">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
