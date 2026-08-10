import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { locationsNear } from "@/lib/campus";
import { CAMPUS_SAFETY, nearestDropOffPoints } from "@/lib/campus-safety";
import { confidenceLabel, getMatchesForPost } from "@/lib/matching";
import { expiryDate, getPost } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/vocabulary";
import { startConversation } from "@/app/messages/actions";
import { decideClaim, dismissMatch, setPostResolved } from "./actions";
import { ClaimForm } from "./ClaimForm";
import { PostOwnerControls } from "./PostOwnerControls";
import { ReportButton } from "./ReportButton";
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

  const matches = await getMatchesForPost(post.id);

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
          className="text-sm text-subtle transition hover:text-ink"
        >
          ← Back to {isFound ? "found" : "lost"} items
        </Link>

        {created && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-line bg-success-subtle px-4 py-3 text-sm text-success"
          >
            Posted. It&rsquo;s now visible on the {isFound ? "Found" : "Lost"} board.
          </p>
        )}

        <article className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                isFound
                  ? "rounded-full bg-success-subtle px-2.5 py-0.5 text-xs font-medium text-success"
                  : "rounded-full bg-warning-subtle px-2.5 py-0.5 text-xs font-medium text-warning"
              }
            >
              {isFound ? "Found" : "Lost"}
            </span>
            <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium text-ink">
              {CATEGORY_LABELS[post.category]}
            </span>
            {post.status === "RESOLVED" && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-white">
                Reunited
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            {post.title}
          </h1>

          <p className="mt-1 text-sm text-subtle">
            Posted by {post.author.name ?? "a student"} ·{" "}
            <time dateTime={post.createdAt.toISOString()}>{formatDay(post.createdAt)}</time>
          </p>

          {post.images.length > 0 && (
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {post.images.map((image) => (
                <li key={image.id}>
                  <a href={image.url} target="_blank" rel="noreferrer">
                    {/* Blob serves these; next/image would need remotePatterns
                        config for no benefit at these sizes. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Photo of ${post.title}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-lg border border-line object-cover transition hover:opacity-90"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 whitespace-pre-wrap leading-relaxed text-ink">
            {post.description}
          </p>

          <dl className="mt-6 grid gap-x-6 gap-y-3 rounded-xl border border-line bg-raised p-4 text-sm sm:grid-cols-2">
            <Detail label={isFound ? "Found at" : "Lost at"}>
              {LOCATION_LABELS[post.location]}
              {post.locationDetail && (
                <span className="text-subtle"> — {post.locationDetail}</span>
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

          {post.isAuthor && isFound && isOpen && (
            <p className="mt-4 rounded-xl border border-line bg-warning-subtle px-4 py-3 text-sm leading-relaxed text-warning">
              <strong className="font-medium">You decide who gets this.</strong>{" "}
              When someone claims it, they&rsquo;ll describe something identifying.
              You&rsquo;re holding the item, so you can judge — and if
              you&rsquo;re unsure, reply and ask about something the description
              doesn&rsquo;t mention.
            </p>
          )}

          {isFound && dropOffs[0] && isOpen && (
            <p className="mt-4 text-sm leading-relaxed text-subtle">
              Nearest official drop box: {dropOffs[0].point.label}
              {formatDropOffDistance(dropOffs[0].metres)}. {CAMPUS_SAFETY.name} holds
              items for {CAMPUS_SAFETY.retentionDays} days.
            </p>
          )}
        </article>

        {/* --- Possible matches -------------------------------------------- */}

        {isOpen && matches.length > 0 && (
          <section className="mt-8 border-t border-line pt-6">
            <h2 className="font-medium text-ink">
              {isFound ? "People looking for something like this" : "Might these be yours?"}
            </h2>
            <p className="mt-0.5 mb-3 text-sm text-subtle">
              Suggested automatically from the wording, category, place and dates.
              Worth a look, not a guarantee.
            </p>

            <ul className="space-y-2">
              {matches.map((match) => (
                <li
                  key={match.id}
                  className="rounded-xl border border-line bg-raised p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/posts/${match.other.id}`} className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-text">
                          {confidenceLabel(match.score, match.textScore)}
                        </span>
                        <span className="truncate font-medium text-ink">
                          {match.other.title}
                        </span>
                      </p>
                      <p className="mt-1.5 text-xs text-subtle">
                        {LOCATION_LABELS[match.other.location]}
                        {" · "}
                        {match.daysApart === 0
                          ? "same day"
                          : `${match.daysApart} day${match.daysApart === 1 ? "" : "s"} apart`}
                        {match.categoryHit && " · same category"}
                      </p>
                    </Link>

                    {post.isAuthor && (
                      <form action={dismissMatch}>
                        <input type="hidden" name="matchId" value={match.id} />
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="shrink-0 rounded-md px-2 py-1 text-xs text-subtle transition hover:bg-sunken hover:text-ink"
                        >
                          Not it
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* --- Claims ------------------------------------------------------ */}

        {(canClaim ||
          myClaim ||
          (!post.isAuthor && isOpen) ||
          (post.isAuthor && pendingClaims.length > 0)) && (
          <section className="mt-8 border-t border-line pt-6">
            <h2 className="mb-1 font-medium text-ink">
              {post.isAuthor
                ? "Claims on this item"
                : isFound
                  ? "Is this yours?"
                  : "Seen this?"}
            </h2>
            {post.isAuthor && pendingClaims.length > 0 && (
              <p className="mb-3 text-sm text-subtle">
                Does what they describe match the item you have? Approve only if
                you&rsquo;re satisfied — otherwise reply below and ask them
                something more specific first.
              </p>
            )}
            {!post.isAuthor && !isFound && (
              <p className="mb-3 text-sm text-subtle">
                If you&rsquo;ve found this or know where it is, message them
                directly.
              </p>
            )}

            {canClaim && <ClaimForm postId={post.id} />}

            {/* Available on both boards: on a LOST post there's nothing to
                claim, but the finder still needs a way to reach the owner. */}
            {!post.isAuthor && isOpen && (
              <form action={startConversation} className="mt-3">
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-line-strong bg-raised px-4 py-2 text-sm font-medium text-ink transition hover:bg-sunken"
                >
                  Message {post.author.name ?? "them"}
                </button>
              </form>
            )}

            {myClaim && !post.isAuthor && <MyClaimStatus status={myClaim.status} />}

            {post.isAuthor &&
              pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="mb-3 rounded-xl border border-line bg-raised p-4"
                >
                  <p className="text-sm text-subtle">
                    <span className="font-medium text-ink">
                      {claim.claimant.name ?? "A student"}
                    </span>{" "}
                    · {formatDay(claim.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-ink">{claim.answer}</p>

                  <div className="mt-3 flex gap-2 border-t border-line pt-3">
                    <form action={decideClaim}>
                      <input type="hidden" name="claimId" value={claim.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <button
                        type="submit"
                        className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-hover"
                      >
                        That&rsquo;s them — approve
                      </button>
                    </form>
                    <form action={decideClaim}>
                      <input type="hidden" name="claimId" value={claim.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <button
                        type="submit"
                        className="rounded-lg border border-line-strong px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-sunken"
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
          <section className="mt-8 border-t border-line pt-6">
            <form action={setPostResolved} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="resolved" value={isOpen ? "true" : "false"} />
              <button
                type="submit"
                className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-ink transition hover:bg-sunken"
              >
                {isOpen
                  ? isFound
                    ? "Mark as returned to owner"
                    : "Mark as found"
                  : "Reopen this post"}
              </button>
              <span className="text-sm text-subtle">
                {isOpen
                  ? "Closes the post and takes it off the board."
                  : "This post is closed."}
              </span>
            </form>

            <div className="mt-4">
              <PostOwnerControls postId={post.id} isOpen={isOpen} />
            </div>
          </section>
        )}

        {!post.isAuthor && (
          <section className="mt-8 border-t border-line pt-6">
            <ReportButton postId={post.id} />
          </section>
        )}

        {/* --- Replies ------------------------------------------------------ */}

        <section className="mt-8 border-t border-line pt-6">
          <h2 className="font-medium text-ink">
            {post.comments.length === 0
              ? "No replies yet"
              : `${post.comments.length} ${post.comments.length === 1 ? "reply" : "replies"}`}
          </h2>

          {post.comments.length > 0 && (
            <ul className="mt-4 space-y-4">
              {post.comments.map((comment) => (
                <li key={comment.id} className="text-sm">
                  <p className="text-subtle">
                    <span className="font-medium text-ink">
                      {comment.author.name ?? "A student"}
                    </span>{" "}
                    · {formatDay(comment.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-ink">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}

          {isOpen ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="mt-4 text-sm text-subtle">
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
    PENDING: "border-line bg-sunken text-ink",
    APPROVED: "border-line bg-success-subtle text-success",
    REJECTED: "border-line bg-sunken text-muted",
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
      <dt className="text-xs uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}
