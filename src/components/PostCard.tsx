import Link from "next/link";

import type { FeedPost } from "@/lib/posts";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/vocabulary";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-medium text-stone-900">{post.title}</h2>

            <p className="mt-1 line-clamp-2 text-sm text-stone-600">
              {post.description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
              <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-700">
                {CATEGORY_LABELS[post.category]}
              </span>
              <span>{LOCATION_LABELS[post.location]}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.occurredOn.toISOString()}>
                {formatDay(post.occurredOn)}
              </time>
              {post._count.comments > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    {post._count.comments}{" "}
                    {post._count.comments === 1 ? "reply" : "replies"}
                  </span>
                </>
              )}
            </div>
          </div>

          {post.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.images[0].url}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
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
