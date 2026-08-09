import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { locationsNear } from "@/lib/campus";
import { CAMPUS_SAFETY, nearestDropOffPoints } from "@/lib/campus-safety";
import { expiryDate, getPost } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/vocabulary";
import { decideClaim, setPostResolved } from "./actions";
import { ClaimForm } from "./ClaimForm";
import { CommentForm } from "./CommentForm";

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
  const isOpen = post.status === "OPEN";
  const nearby = locationsNear(post.location, 150, 3);
  const dropOffs = isFound ? nearestDropOffPoints(post.location, 1) : [];

  const pendingClaims = post.claims.filter((c) => c.status === "PENDING");
  const myClaim = post.claims.find((c) => c.claimantId === user.id);
  const canClaim = isFound && isOpen && !post.isAuthor && !myClaim;

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
          <div className="flex flex-wrap items-center gap-2">
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
            <Detail label={post.status === "RESOLVED" ? "Reunited" : "Expires"}>
              {(post.status === "RESOLVED" && post.resolvedAt
                ? post.resolvedAt
                : expiryDate(post.createdAt)
              ).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
            </Detail>
            {nearby.length > 0 && (
              <Detail label="Also worth checking">
                {nearby.map((l) => LOCATION_LABELS[l]).join(", ")}
              </Detail>
            )}
          </dl>

          {post.isAuthor && isFound && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
              <strong className="font-medium">Only you can see this:</strong>{" "}
              {post.secretDetail
                ? `the detail you held back is “${post.secretDetail}”. Compare it against what claimants describe.`
                : "you didn't hold back a detail, so there's no way to check whether a claimant really owns this. Anyone can say it's theirs."}
            </p>
          )}

          {isFound && dropOffs[0] && isOpen && (
            <p className="mt-4 text-sm leading-relaxed text-stone-500">
              Nearest official drop box: {dropOffs[0].point.label}
              {formatDropOffDistance(dropOffs[0].metres)}. {CAMPUS_SAFETY.name} holds
              items for {CAMPUS_SAFETY.retentionDays} days.
            </p>
          )}
        </article>

        {/* --- Claims ------------------------------------------------------ */}

        {(canClaim || myClaim || (post.isAuthor && pendingClaims.length > 0)) && (
          <section className="mt-8 border-t border-stone-200 pt-6">
            <h2 className="mb-3 font-medium text-stone-900">
              {post.isAuthor ? "Claims on this item" : "Is this yours?"}
            </h2>

            {canClaim && <ClaimForm postId={post.id} />}

            {myClaim && !post.isAuthor && <MyClaimStatus status={myClaim.status} />}

            {post.isAuthor &&
              pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="mb-3 rounded-xl border border-stone-200 bg-white p-4"
                >
                  <p className="text-sm text-stone-500">
                    <span className="font-medium text-stone-800">
                      {claim.claimant.name ?? "A student"}
                    </span>{" "}
                    · {formatDay(claim.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-stone-800">{claim.answer}</p>

                  <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
                    <form action={decideClaim}>
                      <input type="hidden" name="claimId" value={claim.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <button
                        type="submit"
                        className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark"
                      >
                        That&rsquo;s them — approve
                      </button>
                    </form>
                    <form action={decideClaim}>
                      <input type="hidden" name="claimId" value={claim.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <button
                        type="submit"
                        className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                      >
                        Doesn&rsquo;t match
                      </button>
                    </form>
                  </div>
                </div>
              ))}
          </section>
        )}

        {/* --- Author controls --------------------------------------------- */}

        {post.isAuthor && (
          <section className="mt-8 border-t border-stone-200 pt-6">
            <form action={setPostResolved} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="resolved" value={isOpen ? "true" : "false"} />
              <button
                type="submit"
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                {isOpen
                  ? isFound
                    ? "Mark as returned to owner"
                    : "Mark as found"
                  : "Reopen this post"}
              </button>
              <span className="text-sm text-stone-500">
                {isOpen
                  ? "Closes the post and takes it off the board."
                  : "This post is closed."}
              </span>
            </form>
          </section>
        )}

        {/* --- Replies ------------------------------------------------------ */}

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

          {isOpen ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="mt-4 text-sm text-stone-500">
              This post is closed, so replies are turned off.
            </p>
          )}
        </section>
      </main>
    </>
  );
}

function MyClaimStatus({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const styles = {
    PENDING: "border-stone-200 bg-stone-50 text-stone-700",
    APPROVED: "border-green-200 bg-green-50 text-green-900",
    REJECTED: "border-stone-200 bg-stone-50 text-stone-600",
  } as const;

  const messages = {
    PENDING: "You've claimed this item. The finder is reviewing what you wrote.",
    APPROVED: "The finder confirmed it's yours. Get in touch to arrange pickup.",
    REJECTED: "The finder didn't think the details matched. If you're sure it's yours, reply below with more detail.",
  } as const;

  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${styles[status]}`}>
      {messages[status]}
    </p>
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
