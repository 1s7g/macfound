import Link from "next/link";

import { Badge } from "@/components/ui";
import type { FeedPost } from "@/lib/posts";
import { LOCATION_LABELS } from "@/lib/vocabulary";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="group flex gap-4 rounded-card border border-line bg-raised p-4 shadow-card transition-all duration-150 hover:border-brand-border hover:shadow-raised"
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
          <div
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-sunken"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-subtle/60"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m21 15-4.5-4.5L7 20" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium text-ink transition-colors group-hover:text-brand-text">
            {post.title}
          </h2>
          <p className="mt-1 text-sm text-subtle">
            {LOCATION_LABELS[post.location]} · {formatDay(post.occurredOn)}
          </p>

          {/* Worth the extra line on an otherwise deliberately bare card: it
              changes what you do next — collect it from a desk rather than
              message a stranger and arrange a meeting. */}
          {post.handedInAt && (
            <p className="mt-1.5">
              <Badge tone="brand">At Campus Safety</Badge>
            </p>
          )}
        </div>
      </Link>
    </li>
  );
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
