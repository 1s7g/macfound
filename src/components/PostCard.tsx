import Link from "next/link";

import { Badge } from "@/components/ui";
import type { FeedPost } from "@/lib/posts";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/vocabulary";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="group flex gap-4 rounded-card border border-line bg-raised p-4 shadow-card transition-all duration-150 hover:border-brand-border hover:shadow-raised"
      >
        {/* Thumbnail leads on the left at a fixed size, so a feed of mixed
            photo/no-photo posts still scans as an even column. */}
        {post.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.images[0].url}
            alt=""
            loading="lazy"
            className="h-[68px] w-[68px] shrink-0 rounded-[10px] object-cover"
          />
        ) : (
          // A "no photo" glyph rather than the category's initial — a lone "E"
          // for Electronics reads as content, not as an absence.
          <div
            aria-hidden
            className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[10px] bg-sunken"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-subtle/60"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m21 15-4.5-4.5L7 20" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-ink transition-colors group-hover:text-brand-text">
            {post.title}
          </h2>

          <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {post.description}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
            <Badge>{CATEGORY_LABELS[post.category]}</Badge>
            <span className="truncate">{LOCATION_LABELS[post.location]}</span>
            <Dot />
            <time dateTime={post.occurredOn.toISOString()}>{formatDay(post.occurredOn)}</time>
            {post._count.comments > 0 && (
              <>
                <Dot />
                <span>
                  {post._count.comments} {post._count.comments === 1 ? "reply" : "replies"}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

function Dot() {
  return <span aria-hidden>·</span>;
}

export function formatDay(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    ...(day.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}
