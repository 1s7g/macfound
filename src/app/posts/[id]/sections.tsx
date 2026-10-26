import Link from "next/link";

import { formatDay } from "@/components/PostCard";
import { ChevronRightGlyph, Icon, PinGlyph, TagGlyph } from "@/components/icons";
import { Badge, Button, ButtonLink, Card } from "@/components/ui";
import type { getMatchesForPost } from "@/lib/matching";
import { confidenceLabel } from "@/lib/matching";
import type { getPost } from "@/lib/posts";
import { expiryDate } from "@/lib/posts";
import { LOCATION_LABELS } from "@/lib/vocabulary";
import { decideClaim, dismissMatch, setPostResolved } from "./actions";
import { PostOwnerControls } from "./PostOwnerControls";

/*
 * Pieces of the post page that both layouts render.
 *
 * Desktop and phone arrange the page differently — a sidebar beside the
 * content versus one column with a bar pinned to the bottom — but what an owner
 * can do with a claim, or how a match row reads, shouldn't drift between them.
 * Anything that is the same on both lives here.
 */

export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPost>>>;
export type PostMatches = Awaited<ReturnType<typeof getMatchesForPost>>;
export type PostClaim = PostDetail["claims"][number];

export function PostBadges({ post, handedIn }: { post: PostDetail; handedIn: boolean }) {
  const isFound = post.type === "FOUND";
  return (
    <>
      <Badge tone={isFound ? "found" : "lost"}>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
        {isFound ? "Found" : "Lost"}
      </Badge>
      {post.status === "RESOLVED" && <Badge tone="resolved">Reunited</Badge>}
      {post.status === "REMOVED" && <Badge tone="danger">Removed</Badge>}
      {post.status === "EXPIRED" && <Badge>Expired</Badge>}
      {/* Short form deliberately: "At Campus Safety Services" wraps the
          badge row, and the panel below gives the full name anyway. */}
      {handedIn && (
        <Badge tone="brand">
          <Icon className="h-3 w-3">
            <PinGlyph />
          </Icon>
          At Campus Safety
        </Badge>
      )}
    </>
  );
}

/** The owner's card: close or reopen the post, and the handoff once a claim is approved. */
export function OwnerPanel({
  post,
  approvedClaim,
  handoffThreadId,
}: {
  post: PostDetail;
  approvedClaim?: PostClaim;
  handoffThreadId?: string;
}) {
  const isFound = post.type === "FOUND";
  const isOpen = post.status === "OPEN";
  const handingOver = Boolean(approvedClaim && isOpen);

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium text-ink">
        {handingOver ? `Returning to ${approvedClaim!.claimant.name ?? "the owner"}` : "Manage"}
      </p>
      {handingOver && (
        <>
          <p className="text-xs leading-relaxed text-subtle">
            You confirmed it&rsquo;s theirs. Meet somewhere public, then mark it
            returned.
          </p>
          {handoffThreadId && (
            <ButtonLink href={`/messages/${handoffThreadId}`} variant="secondary" className="w-full">
              Message {approvedClaim!.claimant.name ?? "them"}
            </ButtonLink>
          )}
        </>
      )}
      <form action={setPostResolved}>
        <input type="hidden" name="postId" value={post.id} />
        <input type="hidden" name="resolved" value={isOpen ? "true" : "false"} />
        <Button type="submit" variant={handingOver ? "primary" : "secondary"} className="w-full">
          {isOpen ? (isFound ? "Mark as returned" : "Mark as found") : "Reopen this post"}
        </Button>
      </form>
      {/* Expiry is post admin, not a fact about the item — it only means
          something to the person who can act on it, so it lives here rather
          than in front of every visitor. */}
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
  );
}

/** Suggested pairings from the matcher. Renders nothing when there are none. */
export function MatchList({ post, matches }: { post: PostDetail; matches: PostMatches }) {
  if (post.status !== "OPEN" || matches.length === 0) return null;
  const isFound = post.type === "FOUND";

  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-semibold text-ink">
        {isFound ? "People looking for something like this" : "Might these be yours?"}
      </h2>
      <p className="mt-1 mb-3 text-sm text-subtle">
        Suggested by wording, place and dates. Worth a look, not a guarantee.
      </p>

      <ul className="space-y-2">
        {matches.map((match) => (
          <li
            key={match.id}
            className="flex items-center gap-3 rounded-card border border-line bg-raised p-3 transition-colors hover:border-brand-border"
          >
            <Link href={`/posts/${match.other.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              {/* Recognising a photo is faster than reading a title, which is
                  the whole job of a match row. */}
              {match.other.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.other.images[0].url}
                  alt=""
                  loading="lazy"
                  className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-sunken"
                >
                  <Icon className="h-5 w-5 text-subtle/60">
                    <TagGlyph />
                  </Icon>
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{confidenceLabel(match.score, match.textScore)}</Badge>
                  <span className="truncate font-medium text-ink">{match.other.title}</span>
                </span>
                <span className="mt-1 block text-xs text-subtle">
                  {LOCATION_LABELS[match.other.location]}
                  {" · "}
                  {match.daysApart === 0
                    ? "same day"
                    : `${match.daysApart} day${match.daysApart === 1 ? "" : "s"} apart`}
                  {match.categoryHit && " · same category"}
                </span>
              </span>

              {!post.isAuthor && (
                <Icon className="h-4 w-4 text-subtle">
                  <ChevronRightGlyph />
                </Icon>
              )}
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
  );
}

/** Pending claims, for the finder to approve or turn down. Nothing when there are none. */
export function ClaimReview({ claims }: { claims: PostClaim[] }) {
  if (claims.length === 0) return null;

  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-semibold text-ink">
        {claims.length} {claims.length === 1 ? "claim" : "claims"} to review
      </h2>
      <p className="mt-1 mb-3 text-sm text-subtle">
        You&rsquo;re holding the item, so you decide. Approve only if the detail
        matches — if unsure, message them and ask about something the post
        doesn&rsquo;t mention.
      </p>

      <ul className="space-y-3">
        {claims.map((claim) => (
          <li key={claim.id} className="rounded-card border border-line bg-raised p-4">
            <p className="text-sm text-subtle">
              <span className="font-medium text-ink">{claim.claimant.name ?? "A student"}</span> ·{" "}
              {formatDay(claim.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-ink">{claim.answer}</p>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              <form action={decideClaim}>
                <input type="hidden" name="claimId" value={claim.id} />
                <input type="hidden" name="decision" value="approve" />
                <Button type="submit" size="sm">
                  Approve
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
  );
}

export const CLAIM_STATUS_MESSAGES = {
  PENDING: "You've claimed this. The finder is reviewing what you wrote.",
  APPROVED: "The finder confirmed it's yours. Message them to arrange pickup.",
  REJECTED:
    "The finder didn't think the details matched. If you're sure it's yours, message them with more detail.",
} as const;

export function MyClaimStatus({ status }: { status: keyof typeof CLAIM_STATUS_MESSAGES }) {
  const styles = {
    PENDING: "border-line bg-sunken text-muted",
    APPROVED: "border-line bg-success-subtle text-success",
    REJECTED: "border-line bg-sunken text-muted",
  } as const;

  return (
    <p className={`rounded-control border px-3 py-2.5 text-xs leading-relaxed ${styles[status]}`}>
      {CLAIM_STATUS_MESSAGES[status]}
    </p>
  );
}

/**
 * A drop box in the same building as the find reports as 0m, and "(0m away)"
 * reads like a bug. Say what it means instead.
 */
export function formatDropOffDistance(metres: number | null): string {
  if (metres === null) return "";
  if (metres < 25) return " — same building";
  return ` (about ${Math.round(metres / 10) * 10}m away)`;
}
