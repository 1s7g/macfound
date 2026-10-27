import Link from "next/link";
import type { ReactNode } from "react";

import { formatDay } from "@/components/PostCard";
import { CategoryIcon } from "@/components/icons";
import { LOCATION_LABELS } from "@/lib/vocabulary";
import type { Category, CampusLocation, PostType } from "@/generated/prisma/enums";

/**
 * One post as a phone list row, shared by Browse and Me.
 *
 * Three short lines instead of one crowded one: a coloured "Lost · Yesterday"
 * eyebrow, the title, and the place. Squeezing the badge, place and date onto a
 * single line truncated the date — the one detail that tells you whether a post
 * is worth opening — on every long building name.
 *
 * With no photo, the tile shows the category's icon, so a row always says what
 * kind of thing it is before the title is read.
 */
export function MobilePostRow({
  post,
  extra,
}: {
  post: {
    id: string;
    type: PostType;
    title: string;
    category: Category;
    location: CampusLocation;
    occurredOn: Date;
    images: { url: string }[];
  };
  /** A status badge or similar, under the place. */
  extra?: ReactNode;
}) {
  const isFound = post.type === "FOUND";

  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex items-center gap-3.5 rounded-card border border-line bg-raised p-3 active:bg-sunken"
    >
      {post.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.images[0].url}
          alt=""
          loading="lazy"
          className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[10px] object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[10px] bg-sunken text-muted"
        >
          <CategoryIcon category={post.category} className="h-7 w-7" />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-muted">
          <span className={`font-semibold ${isFound ? "text-success" : "text-warning"}`}>
            {isFound ? "Found" : "Lost"}
          </span>
          {" · "}
          {formatDay(post.occurredOn)}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[15px] leading-snug font-medium text-ink">
          {post.title}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">
          {LOCATION_LABELS[post.location]}
        </span>
        {extra && <span className="mt-1.5 flex flex-wrap gap-1.5">{extra}</span>}
      </span>
    </Link>
  );
}
