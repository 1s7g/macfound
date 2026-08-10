import Link from "next/link";

import { FeedFilters } from "@/components/FeedFilters";
import { PostCard } from "@/components/PostCard";
import { ButtonLink, EmptyState } from "@/components/ui";
import { FEED_PAGE_SIZE, getFeed } from "@/lib/posts";
import type { Category, CampusLocation, PostType } from "@/generated/prisma/enums";

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
      <div className="flex items-center justify-between">
        <h1 className="text-title font-semibold text-ink">
          {isLost ? "Lost" : "Found"}
        </h1>
        <ButtonLink
          href={`/posts/new?type=${isLost ? "lost" : "found"}`}
          size="sm"
        >
          New post
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
      title={isLost ? "Nothing reported lost yet." : "Nothing handed in yet."}
      action={
        <ButtonLink href={`/posts/new?type=${isLost ? "lost" : "found"}`}>
          {isLost ? "Report a lost item" : "Post a found item"}
        </ButtonLink>
      }
    />
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
