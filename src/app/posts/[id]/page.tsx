import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { Badge, Button, buttonClass, Card } from "@/components/ui";
import { locationsNear } from "@/lib/campus";
import { CAMPUS_SAFETY, nearestDropOffPoints } from "@/lib/campus-safety";
import { confidenceLabel, getMatchesForPost } from "@/lib/matching";
import { expiryDate, getPost } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/vocabulary";
import { startConversation } from "@/app/messages/actions";
import { decideClaim, dismissMatch, setPostResolved } from "./actions";
import { ClaimForm } from "./ClaimForm";
import { CommentForm } from "./CommentForm";
import { PostOwnerControls } from "./PostOwnerControls";
import { ReportButton } from "./ReportButton";

export const metadata: Metadata = { title: "Post · MacFound" };

/**
 * Post detail.
 *
 * Laid out as content + a sticky side panel rather than one long column. The
 * previous version stacked fifteen sections at equal weight, which buried the
 * only thing most visitors come here to do — claim the item or message the
 * person — below the match list. Facts and actions now sit beside the content
 * on desktop and directly under the description on mobile, ahead of everything
 * discussion-shaped.
 */
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

  // Only a found item can be handed in, but guard on both so a stale row can
  // never render collection directions on a lost report.
  const handedIn = isFound && post.handedInAt !== null;
  const holdsUntil = post.handedInAt
    ? new Date(post.handedInAt.getTime() + CAMPUS_SAFETY.retentionDays * 86_400_000)
    : null;

  return (
    <>
      <Header user={user} active={isFound ? "found" : "lost"} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
        <Link
          href={isFound ? "/found" : "/lost"}
          className="inline-block text-sm text-subtle transition-colors hover:text-ink"
        >
          ← Back to {isFound ? "found" : "lost"} items
        </Link>

        {created && (
          <p
            role="status"
            className="mt-3 rounded-control border border-line bg-success-subtle px-4 py-3 text-sm text-success"
          >
            Posted. It&rsquo;s now visible on the {isFound ? "Found" : "Lost"} board.
          </p>
        )}

        {/* Explicit placement so the discussion starts directly under the
            description on desktop rather than waiting for the taller sidebar,
            while DOM order still puts the actions above it on mobile. */}
        <div className="mt-5 grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          {/* --- Content ---------------------------------------------------- */}
          <article className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isFound ? "found" : "lost"}>{isFound ? "Found" : "Lost"}</Badge>
              {post.status === "RESOLVED" && <Badge tone="resolved">Reunited</Badge>}
              {post.status === "REMOVED" && <Badge tone="danger">Removed</Badge>}
              {post.status === "EXPIRED" && <Badge>Expired</Badge>}
              {/* Short form deliberately: "At Campus Safety Services" wraps the
                  badge row, and the panel below gives the full name anyway. */}
              {handedIn && <Badge tone="brand">At Campus Safety</Badge>}
            </div>

            <h1 className="mt-3 text-title font-semibold text-ink sm:text-display">
              {post.title}
            </h1>

            {/*
              Where and when, as a sentence directly under the title.

              These two facts are what decide whether this is your item, and
              they used to sit in a bordered panel as uppercase label/value
              rows alongside two others — a spec sheet competing with the
              action card beside it. Read as a line, they need no labels: the
              place and the date are self-evidently a place and a date.
            */}
            <p className="mt-3 text-[15px] leading-relaxed text-ink">
              {isFound ? "Found at" : "Lost at"}{" "}
              <span className="font-medium">{LOCATION_LABELS[post.location]}</span>
              {" · "}
              <time dateTime={post.occurredOn.toISOString()} className="font-medium">
                {post.occurredOn.toLocaleDateString("en-CA", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>

            {post.locationDetail && (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {post.locationDetail}
              </p>
            )}

            <p className="mt-3 text-sm text-subtle">
              {CATEGORY_LABELS[post.category]} · posted by{" "}
              {post.author.name ?? "a student"}{" "}
              <time dateTime={post.createdAt.toISOString()}>
                {formatDay(post.createdAt).toLowerCase()}
              </time>
            </p>

            {post.images.length > 0 && (
              <ul
                className={`mt-6 grid gap-2 ${
                  post.images.length === 1 ? "max-w-sm" : "grid-cols-2 sm:grid-cols-3"
                }`}
              >
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
                        className="aspect-square w-full rounded-card border border-line object-cover transition-opacity hover:opacity-90"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
              {post.description}
            </p>

            {/* Guidance and the drop-box hint live with the content rather than
                in the sidebar: they're prose, not actions, and a tall sidebar
                inflates the grid row and strands the discussion below a gap. */}
            {/* Both of these assume the finder still has the item, so neither
                applies once it's been handed in: there's nobody to judge a
                claim, and pointing at a drop box they've already used is noise. */}
            {post.isAuthor && isFound && isOpen && !handedIn && (
              <p className="mt-6 rounded-card border border-line bg-warning-subtle px-4 py-3 text-sm leading-relaxed text-warning">
                <strong className="font-semibold">You decide who gets this.</strong>{" "}
                Claimants describe something identifying — you&rsquo;re holding the
                item, so you can judge. Unsure? Reply and ask about something the
                description doesn&rsquo;t mention.
              </p>
            )}

            {isFound && dropOffs[0] && isOpen && !handedIn && (
              <p className="mt-4 text-sm leading-relaxed text-subtle">
                Nearest drop box: {dropOffs[0].point.label}
                {formatDropOffDistance(dropOffs[0].metres)}. {CAMPUS_SAFETY.name} holds
                items for {CAMPUS_SAFETY.retentionDays} days.
              </p>
            )}

            {/* A search hint rather than a fact about the item, so it reads as
                a footnote here instead of a labelled row in a facts panel. */}
            {nearby.length > 0 && isOpen && (
              <p className="mt-4 text-sm leading-relaxed text-subtle">
                Also worth checking nearby:{" "}
                {nearby.map((l) => LOCATION_LABELS[l]).join(", ")}.
              </p>
            )}
          </article>

          {/* --- Facts and actions ------------------------------------------ */}
          {/* One card, so there is never a question about where to act. The
              facts panel that used to sit above this competed with it at equal
              visual weight; those facts now read as a line under the title. */}
          <aside className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20">
            {/* Handed in changes the whole ask. There is no custody question and
                nobody to negotiate with — the item is on a shelf at a fixed
                address, so the panel becomes directions rather than a claim
                form. Messaging stays available for questions, demoted. */}
            {!post.isAuthor && isOpen && handedIn && (
              <Card className="space-y-3 p-4">
                <p className="text-sm font-medium text-ink">
                  Collect it from {CAMPUS_SAFETY.name}
                </p>
                {/* Prose rather than three more label/value rows: it's an
                    address, a reminder and a deadline, which a sentence carries
                    perfectly well. The deadline is the one number that matters,
                    so it's the only thing emphasised. */}
                <p className="text-sm leading-relaxed text-muted">
                  {CAMPUS_SAFETY.building}. Bring your student card.
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  Held until{" "}
                  <span className="font-medium text-ink">
                    {holdsUntil!.toLocaleDateString("en-CA", {
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  , then disposed of.
                </p>
                <a
                  href={CAMPUS_SAFETY.url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass("primary", "md", "w-full")}
                >
                  Hours &amp; contact
                </a>
                <form action={startConversation}>
                  <input type="hidden" name="postId" value={post.id} />
                  <Button type="submit" variant="secondary" className="w-full">
                    Ask {post.author.name ?? "them"} a question
                  </Button>
                </form>
              </Card>
            )}

            {!post.isAuthor && isOpen && !handedIn && (
              <Card className="space-y-3 p-4">
                <p className="text-sm font-medium text-ink">
                  {isFound ? "Is this yours?" : "Seen this?"}
                </p>
                <p className="text-xs leading-relaxed text-subtle">
                  {isFound
                    ? "Claim it and describe something identifying, or just message them."
                    : "Found it, or know where it is? Message them directly."}
                </p>
                {canClaim && <ClaimForm postId={post.id} />}
                {myClaim && <MyClaimStatus status={myClaim.status} />}
                <form action={startConversation}>
                  <input type="hidden" name="postId" value={post.id} />
                  <Button type="submit" variant={canClaim ? "secondary" : "primary"} className="w-full">
                    Message {post.author.name ?? "them"}
                  </Button>
                </form>
              </Card>
            )}

            {post.isAuthor && (
              <Card className="space-y-3 p-4">
                <p className="text-sm font-medium text-ink">Manage</p>
                <form action={setPostResolved}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="resolved" value={isOpen ? "true" : "false"} />
                  <Button type="submit" variant="secondary" className="w-full">
                    {isOpen
                      ? isFound
                        ? "Mark as returned"
                        : "Mark as found"
                      : "Reopen this post"}
                  </Button>
                </form>
                {/* Expiry is post admin, not a fact about the item — it only
                    means something to the person who can act on it, so it lives
                    here rather than in front of every visitor. */}
                <p className="text-xs leading-relaxed text-subtle">
                  {post.status === "RESOLVED" && post.resolvedAt
                    ? `Reunited ${post.resolvedAt.toLocaleDateString("en-CA", { month: "long", day: "numeric" })}.`
                    : isOpen
                      ? `Closes the post and counts towards items reunited. Expires ${expiryDate(
                          post.createdAt,
                        ).toLocaleDateString("en-CA", { month: "long", day: "numeric" })}.`
                      : "This post is closed."}
                </p>
                <div className="border-t border-line pt-3">
                  <PostOwnerControls postId={post.id} isOpen={isOpen} />
                </div>
              </Card>
            )}

            {!post.isAuthor && (
              <div className="px-1">
                <ReportButton postId={post.id} />
              </div>
            )}
          </aside>

          {/* --- Discussion -------------------------------------------------- */}
          <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
            {isOpen && matches.length > 0 && (
              <section className="border-t border-line pt-6">
                <h2 className="font-semibold text-ink">
                  {isFound
                    ? "People looking for something like this"
                    : "Might these be yours?"}
                </h2>
                <p className="mt-1 mb-3 text-sm text-subtle">
                  Suggested by wording, place and dates. Worth a look, not a guarantee.
                </p>

                <ul className="space-y-2">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="flex items-start justify-between gap-3 rounded-card border border-line bg-raised p-4"
                    >
                      <Link href={`/posts/${match.other.id}`} className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <Badge tone="brand">
                            {confidenceLabel(match.score, match.textScore)}
                          </Badge>
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
                          <Button type="submit" variant="ghost" size="sm">
                            Not it
                          </Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {post.isAuthor && pendingClaims.length > 0 && (
              <section className="border-t border-line pt-6">
                <h2 className="font-semibold text-ink">
                  {pendingClaims.length} {pendingClaims.length === 1 ? "claim" : "claims"} to review
                </h2>
                <p className="mt-1 mb-3 text-sm text-subtle">
                  Does what they describe match the item you have? Approve only
                  if you&rsquo;re sure — otherwise reply and ask for more detail.
                </p>

                <ul className="space-y-3">
                  {pendingClaims.map((claim) => (
                    <li key={claim.id} className="rounded-card border border-line bg-raised p-4">
                      <p className="text-sm text-subtle">
                        <span className="font-medium text-ink">
                          {claim.claimant.name ?? "A student"}
                        </span>{" "}
                        · {formatDay(claim.createdAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-ink">{claim.answer}</p>

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                        <form action={decideClaim}>
                          <input type="hidden" name="claimId" value={claim.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <Button type="submit" size="sm">
                            That&rsquo;s them — approve
                          </Button>
                        </form>
                        <form action={decideClaim}>
                          <input type="hidden" name="claimId" value={claim.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <Button type="submit" variant="secondary" size="sm">
                            Doesn&rsquo;t match
                          </Button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="border-t border-line pt-6">
              <h2 className="font-semibold text-ink">
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
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">
                        {comment.body}
                      </p>
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
          </div>
        </div>
      </main>
    </>
  );
}

function MyClaimStatus({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const styles = {
    PENDING: "border-line bg-sunken text-muted",
    APPROVED: "border-line bg-success-subtle text-success",
    REJECTED: "border-line bg-sunken text-muted",
  } as const;

  const messages = {
    PENDING: "You've claimed this. The finder is reviewing what you wrote.",
    APPROVED: "The finder confirmed it's yours. Message them to arrange pickup.",
    REJECTED:
      "The finder didn't think the details matched. If you're sure it's yours, message them with more detail.",
  } as const;

  return (
    <p className={`rounded-control border px-3 py-2.5 text-xs leading-relaxed ${styles[status]}`}>
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
  if (metres < 25) return " — same building";
  return ` (about ${Math.round(metres / 10) * 10}m away)`;
}
