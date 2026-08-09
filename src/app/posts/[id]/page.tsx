import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { CAMPUS_SAFETY, nearestDropOffPoints } from "@/lib/campus-safety";
import { locationsNear } from "@/lib/campus";
import { expiryDate, getPost } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/vocabulary";

export const metadata: Metadata = { title: "Post · MacFound" };

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const user = await requireUser(`/posts/${id}`);

  const post = await getPost(id, user.id);
  if (!post) notFound();

  const isFound = post.type === "FOUND";
  const nearby = locationsNear(post.location, 150, 3);
  const dropOffs = isFound ? nearestDropOffPoints(post.location, 1) : [];

  return (
    <>
      <Header user={user} active={isFound ? "found" : "lost"} />

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <Link
          href={isFound ? "/found" : "/lost"}
          className="text-sm text-stone-500 transition hover:text-stone-800"
        >
          ← Back to {isFound ? "found" : "lost"} items
        </Link>

        {created && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
          >
            Posted. It&rsquo;s now visible on the {isFound ? "Found" : "Lost"} board.
          </p>
        )}

        <article className="mt-4">
          <div className="flex items-center gap-2">
            <span
              className={
                isFound
                  ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                  : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900"
              }
            >
              {isFound ? "Found" : "Lost"}
            </span>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
              {CATEGORY_LABELS[post.category]}
            </span>
            {post.status === "RESOLVED" && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-white">
                Reunited
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
            {post.title}
          </h1>

          <p className="mt-1 text-sm text-stone-500">
            Posted by {post.author.name ?? "a student"} ·{" "}
            <time dateTime={post.createdAt.toISOString()}>{formatDay(post.createdAt)}</time>
          </p>

          <p className="mt-5 whitespace-pre-wrap leading-relaxed text-stone-800">
            {post.description}
          </p>

          <dl className="mt-6 grid gap-x-6 gap-y-3 rounded-xl border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
            <Detail label={isFound ? "Found at" : "Lost at"}>
              {LOCATION_LABELS[post.location]}
              {post.locationDetail && (
                <span className="text-stone-500"> — {post.locationDetail}</span>
              )}
            </Detail>
            <Detail label={isFound ? "Date found" : "Date lost"}>
              {post.occurredOn.toLocaleDateString("en-CA", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Detail>
            <Detail label="Expires">
              {expiryDate(post.createdAt).toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric",
              })}
            </Detail>
            {nearby.length > 0 && (
              <Detail label="Also worth checking">
                {nearby.map((l) => LOCATION_LABELS[l]).join(", ")}
              </Detail>
            )}
          </dl>

          {post.isAuthor && isFound && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong className="font-medium">Only you can see this:</strong>{" "}
              {post.secretDetail
                ? `your verification detail is “${post.secretDetail}”. Claimants must describe it to prove the item is theirs.`
                : "you didn't set a verification detail, so there's no way to check that a claimant really owns this. Worth adding one."}
            </p>
          )}

          {isFound && dropOffs[0] && (
            <p className="mt-4 text-sm leading-relaxed text-stone-500">
              Nearest official drop box: {dropOffs[0].point.label}
              {formatDropOffDistance(dropOffs[0].metres)}. {CAMPUS_SAFETY.name} holds
              items for {CAMPUS_SAFETY.retentionDays} days.
            </p>
          )}
        </article>

        <section className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="font-medium text-stone-900">
            {post.comments.length === 0
              ? "No replies yet"
              : `${post.comments.length} ${post.comments.length === 1 ? "reply" : "replies"}`}
          </h2>

          {post.comments.length > 0 && (
            <ul className="mt-4 space-y-4">
              {post.comments.map((comment) => (
                <li key={comment.id} className="text-sm">
                  <p className="text-stone-500">
                    <span className="font-medium text-stone-800">
                      {comment.author.name ?? "A student"}
                    </span>{" "}
                    · {formatDay(comment.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-stone-800">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
            Replies, claims and direct messages are coming next.
          </p>
        </section>
      </main>
    </>
  );
}

/**
 * A drop box in the same building as the find reports as 0m, and "(0m away)"
 * reads like a bug. Say what it means instead.
 */
function formatDropOffDistance(metres: number | null): string {
  if (metres === null) return "";
  if (metres < 25) return " — in the same building";
  return ` (about ${Math.round(metres / 10) * 10}m away)`;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-0.5 text-stone-800">{children}</dd>
    </div>
  );
}
