import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import {
  CalendarGlyph,
  CategoryIcon,
  ClockGlyph,
  Icon,
  MessagesGlyph,
  PinGlyph,
  TagGlyph,
} from "@/components/icons";
import { Button, buttonClass, Card } from "@/components/ui";
import { CAMPUS_SAFETY, nearestDropOffPoints } from "@/lib/campus-safety";
import { db } from "@/lib/db";
import { getMatchesForPost } from "@/lib/matching";
import { markReadForHref } from "@/lib/notifications";
import { getPost } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/vocabulary";
import { startConversation } from "@/app/messages/actions";
import { ClaimForm } from "./ClaimForm";
import { MobileActionBar } from "./MobileActionBar";
import { ReportButton } from "./ReportButton";
import {
  CLAIM_STATUS_MESSAGES,
  ClaimReview,
  formatDropOffDistance,
  MatchList,
  MyClaimStatus,
  OwnerPanel,
  PostBadges,
} from "./sections";

export const metadata: Metadata = { title: "Post · MacFound" };

/**
 * Post detail.
 *
 * Two layouts from one set of data. Desktop is content plus a sticky side
 * panel; the previous version stacked fifteen sections at equal weight, which
 * buried the only thing most visitors come here to do — claim the item or
 * message the person — below the match list.
 *
 * Phones get their own column: a photo (or the category's icon) up top, the
 * facts in a readable size, and the one thing to do pinned to the bottom of
 * the screen instead of a stack of full-width buttons mid-page.
 *
 * There are no public replies. Found items already have two private channels —
 * a claim and a message — and a third, public one mostly drew "is this mine?"
 * comments that belonged in a claim.
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

  const [matches] = await Promise.all([
    getMatchesForPost(post.id),
    markReadForHref(user.id, `/posts/${post.id}`),
  ]);

  const isFound = post.type === "FOUND";
  const isOpen = post.status === "OPEN";
  const dropOffs = isFound ? nearestDropOffPoints(post.location, 1) : [];

  const pendingClaims = post.claims.filter((c) => c.status === "PENDING");
  const myClaim = post.claims.find((c) => c.claimantId === user.id);
  const canClaim = isFound && isOpen && !post.isAuthor && !myClaim && !post.ownerConfirmed;

  // The finder's next step once they've picked an owner: meet up, then close.
  const approvedClaim = post.isAuthor
    ? post.claims.find((c) => c.status === "APPROVED")
    : undefined;
  const handoffThread =
    approvedClaim && isOpen
      ? await db.conversation.findUnique({
          where: {
            postId_initiatorId: { postId: post.id, initiatorId: approvedClaim.claimantId },
          },
          select: { id: true },
        })
      : null;

  // Only a found item can be handed in, but guard on both so a stale row can
  // never render collection directions on a lost report.
  const handedIn = isFound && post.handedInAt !== null;
  const holdsUntil = post.handedInAt
    ? new Date(post.handedInAt.getTime() + CAMPUS_SAFETY.retentionDays * 86_400_000)
    : null;
  const holdsUntilLabel = holdsUntil?.toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
  });

  const authorName = post.author.name ?? "them";
  const occurredLabel = post.occurredOn.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const dropOffNote =
    isFound && dropOffs[0] && isOpen && !handedIn
      ? `Nearest drop box: ${dropOffs[0].point.label}${formatDropOffDistance(dropOffs[0].metres)}. ${CAMPUS_SAFETY.name} holds items for ${CAMPUS_SAFETY.retentionDays} days.`
      : null;

  const createdBanner = created && (
    <p
      role="status"
      className="mt-3 rounded-control border border-line bg-success-subtle px-4 py-3 text-sm text-success"
    >
      Posted. It&rsquo;s now visible on the {isFound ? "Found" : "Lost"} board.
    </p>
  );

  return (
    <>
      <Header
        user={user}
        active={isFound ? "found" : "lost"}
        mobile={{ back: { href: "/browse", label: "Browse" }, tabs: post.isAuthor || !isOpen }}
      />

      <main id="main">
        {/* --- Desktop ----------------------------------------------------- */}
        <div className="mx-auto hidden w-full max-w-4xl px-4 py-6 md:block">
          <Link
            href={isFound ? "/found" : "/lost"}
            className="inline-block text-sm text-subtle transition-colors hover:text-ink"
          >
            ← Back to {isFound ? "found" : "lost"} items
          </Link>

          {createdBanner}

          {/* Explicit placement so the matches start directly under the
              description rather than waiting for the taller sidebar. */}
          <div className="mt-5 grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
            <article className="min-w-0 lg:col-start-1 lg:row-start-1">
              <div className="flex flex-wrap items-center gap-2">
                <PostBadges post={post} handedIn={handedIn} />
              </div>

              <h1 className="mt-3 text-title font-semibold text-ink sm:text-display">
                {post.title}
              </h1>

              {/* Where and when, directly under the title. The icons say
                  "place" and "date" faster than labels did, and give the eye
                  something to land on when scanning rather than reading. */}
              <div className="mt-3 space-y-1.5 text-[15px] text-ink">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-subtle">
                      <PinGlyph />
                    </Icon>
                    {isFound ? "Found at" : "Lost at"}{" "}
                    <span className="font-medium">{LOCATION_LABELS[post.location]}</span>
                  </span>
                  <span aria-hidden className="hidden text-subtle sm:inline">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-subtle">
                      <CalendarGlyph />
                    </Icon>
                    <time dateTime={post.occurredOn.toISOString()}>{occurredLabel}</time>
                  </span>
                </p>

                {post.locationDetail && (
                  <p className="pl-[1.375rem] text-sm leading-relaxed text-muted">
                    {post.locationDetail}
                  </p>
                )}

                <p className="flex items-center gap-1.5 text-sm text-subtle">
                  <Icon className="h-4 w-4">
                    <TagGlyph />
                  </Icon>
                  {CATEGORY_LABELS[post.category]}
                </p>
              </div>

              {post.images.length > 0 && (
                <ul
                  className={`mt-6 grid gap-2 ${
                    post.images.length === 1 ? "max-w-sm" : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {post.images.map((image) => (
                    <li key={image.id}>
                      <a href={image.url} target="_blank" rel="noreferrer">
                        {/* Blob serves these; next/image would need
                            remotePatterns config for no benefit at these sizes. */}
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

              {dropOffNote && (
                <p className="mt-4 text-sm leading-relaxed text-subtle">{dropOffNote}</p>
              )}
            </article>

            <aside className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20">
              {/* Handed in changes the whole ask: the item is on a shelf at a
                  fixed address, so the panel becomes directions rather than a
                  claim form. Messaging stays available for questions, demoted. */}
              {!post.isAuthor && isOpen && handedIn && (
                <Card className="space-y-3 p-4">
                  <p className="text-sm font-medium text-ink">
                    Collect it from {CAMPUS_SAFETY.name}
                  </p>
                  <div className="space-y-3 border-b border-line pb-3">
                    <p className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <Icon className="mt-0.5 h-4 w-4 text-subtle">
                        <PinGlyph />
                      </Icon>
                      <span>
                        <span className="block text-ink">{CAMPUS_SAFETY.building}</span>
                        Bring your student card.
                      </span>
                    </p>
                  </div>

                  <p className="flex gap-2.5 text-sm leading-relaxed text-muted">
                    <Icon className="mt-0.5 h-4 w-4 text-subtle">
                      <CalendarGlyph />
                    </Icon>
                    <span>
                      Held until{" "}
                      <span className="font-medium text-ink">{holdsUntilLabel}</span>, then
                      disposed of.
                    </span>
                  </p>

                  <a
                    href={CAMPUS_SAFETY.url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClass("primary", "md", "w-full")}
                  >
                    <Icon className="h-4 w-4">
                      <ClockGlyph />
                    </Icon>
                    Hours &amp; contact
                  </a>
                  <form action={startConversation}>
                    <input type="hidden" name="postId" value={post.id} />
                    <Button type="submit" variant="secondary" className="w-full">
                      <Icon className="h-4 w-4">
                        <MessagesGlyph />
                      </Icon>
                      Ask {authorName} a question
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
                    {!isFound
                      ? "Found it, or know where it is? Message them directly."
                      : post.ownerConfirmed && !myClaim
                        ? "The finder has already confirmed the owner."
                        : "Claim it and describe something identifying, or just message them."}
                  </p>
                  {canClaim && <ClaimForm postId={post.id} />}
                  {myClaim && <MyClaimStatus status={myClaim.status} />}
                  <form action={startConversation}>
                    <input type="hidden" name="postId" value={post.id} />
                    <Button
                      type="submit"
                      variant={canClaim ? "secondary" : "primary"}
                      className="w-full"
                    >
                      Message {authorName}
                    </Button>
                  </form>
                </Card>
              )}

              {post.isAuthor && (
                <OwnerPanel
                  post={post}
                  approvedClaim={approvedClaim}
                  handoffThreadId={handoffThread?.id}
                />
              )}

              {!post.isAuthor && (
                <div className="px-1">
                  <ReportButton postId={post.id} />
                </div>
              )}
            </aside>

            <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
              <MatchList post={post} matches={matches} />
              {post.isAuthor && <ClaimReview claims={pendingClaims} />}
            </div>
          </div>
        </div>

        {/* --- Phone ------------------------------------------------------- */}
        <div className="pb-6 md:hidden">
          {created && <div className="px-4">{createdBanner}</div>}
          {post.images.length > 0 ? (
            // Swipe through photos edge to edge — the most recognisable thing
            // on the page gets the most room.
            <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pt-3 [scrollbar-width:none]">
              {post.images.map((image) => (
                <li key={image.id} className="w-full shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`Photo of ${post.title}`}
                    className="aspect-[4/3] w-full rounded-card object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : null}

          <div className="px-4">
            {/* Without a photo, a small category tile beside the labels says
                what this is. A full-width grey box with an icon in it just
                looked like an image that hadn't loaded. */}
            <div className="mt-4 flex items-center gap-3">
              {post.images.length === 0 && (
                <span
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-sunken text-muted"
                >
                  <CategoryIcon category={post.category} className="h-6 w-6" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm text-muted">{CATEGORY_LABELS[post.category]}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <PostBadges post={post} handedIn={handedIn} />
                </div>
              </div>
            </div>

            <h1 className="mt-4 text-[1.625rem] leading-tight font-semibold tracking-tight text-ink">
              {post.title}
            </h1>

            {/* Place and date as two labelled rows in one card: the two facts
                that decide whether this is your item, set apart from the prose. */}
            <dl className="mt-5 divide-y divide-line rounded-card border border-line bg-raised">
              <div className="flex gap-3 px-4 py-3">
                <Icon className="mt-0.5 h-5 w-5 text-muted">
                  <PinGlyph />
                </Icon>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{isFound ? "Found at" : "Lost at"}</dt>
                  <dd className="text-[15px] text-ink">
                    {LOCATION_LABELS[post.location]}
                    {post.locationDetail && (
                      <span className="block text-sm text-muted">{post.locationDetail}</span>
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 px-4 py-3">
                <Icon className="mt-0.5 h-5 w-5 text-muted">
                  <CalendarGlyph />
                </Icon>
                <div>
                  <dt className="text-xs text-muted">{isFound ? "Found on" : "Lost on"}</dt>
                  <dd className="text-[15px] text-ink">
                    <time dateTime={post.occurredOn.toISOString()}>{occurredLabel}</time>
                  </dd>
                </div>
              </div>
            </dl>

            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-ink">
              {post.description}
            </p>

            {post.isAuthor && (
              <div className="mt-6">
                <OwnerPanel
                  post={post}
                  approvedClaim={approvedClaim}
                  handoffThreadId={handoffThread?.id}
                />
              </div>
            )}

            {/* Collection details read as facts, not buttons — the bar below
                carries the action. */}
            {!post.isAuthor && isOpen && handedIn && (
              <p className="mt-6 rounded-card bg-sunken p-4 text-sm leading-relaxed text-muted">
                Collect it from <span className="text-ink">{CAMPUS_SAFETY.building}</span>{" "}
                with your student card. Held until{" "}
                <span className="font-medium text-ink">{holdsUntilLabel}</span>.
              </p>
            )}

            <div className="mt-8 space-y-8">
              {post.isAuthor && <ClaimReview claims={pendingClaims} />}
              <MatchList post={post} matches={matches} />
            </div>

            {(dropOffNote || !post.isAuthor) && (
              <div className="mt-8 space-y-3 border-t border-line pt-4 text-sm leading-relaxed text-muted">
                {dropOffNote && <p>{dropOffNote}</p>}
                {!post.isAuthor && <ReportButton postId={post.id} />}
              </div>
            )}
          </div>

          {!post.isAuthor && isOpen && (
            <MobileActionBar
              postId={post.id}
              authorName={authorName}
              mode={handedIn ? "collect" : canClaim ? "claim" : "message"}
              collectUrl={CAMPUS_SAFETY.url}
              note={
                handedIn
                  ? undefined
                  : myClaim
                    ? CLAIM_STATUS_MESSAGES[myClaim.status]
                    : isFound && post.ownerConfirmed
                      ? "The finder has already confirmed the owner."
                      : !isFound
                        ? "Found it, or know where it is?"
                        : undefined
              }
            />
          )}
        </div>
      </main>
    </>
  );
}
