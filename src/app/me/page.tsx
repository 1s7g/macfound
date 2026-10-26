import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { MobilePostRow } from "@/components/mobile/MobilePostRow";
import { formatDay } from "@/components/PostCard";
import { Badge, type BadgeTone, Button, ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isModerator } from "@/lib/admin";
import { signOut } from "@/lib/auth";
import { getMyPosts } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { LOCATION_LABELS, POST_STATUS_LABELS } from "@/lib/vocabulary";

export const metadata: Metadata = { title: "Your posts · MacFound" };

const STATUS_TONES: Record<string, BadgeTone> = {
  OPEN: "neutral",
  RESOLVED: "resolved",
  EXPIRED: "neutral",
  REMOVED: "danger",
};

export default async function MyPostsPage() {
  const user = await requireUser("/me");
  const posts = await getMyPosts(user.id);

  const open = posts.filter((p) => p.status === "OPEN").length;
  const reunited = posts.filter((p) => p.status === "RESOLVED").length;

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <>
      <Header user={user} mobile={{ title: "Profile" }} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-5 md:py-6">
        <PageHeader
          title={user.name ?? user.email}
          subtitle={
            posts.length === 0 ? user.email : `${open} open · ${reunited} reunited`
          }
          desktopOnly
          action={
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          }
        />

        {/* Phones: who you are, then your posts under a heading of their own. */}
        <div className="flex items-center gap-4 md:hidden">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-semibold text-on-brand"
          >
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink">{user.name ?? user.email}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
        {posts.length > 0 && (
          <div className="mt-6 mb-2.5 flex items-baseline justify-between md:hidden">
            <h2 className="font-semibold text-ink">Your posts</h2>
            <p className="text-sm text-muted">
              {open} open · {reunited} reunited
            </p>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="mt-6 md:mt-5">
            <EmptyState
              title="You haven't posted anything yet."
              action={
                <>
                  <ButtonLink href="/posts/new?type=lost">Report lost item</ButtonLink>
                  <ButtonLink href="/posts/new?type=found" variant="secondary">
                    Post found item
                  </ButtonLink>
                </>
              }
            />
          </div>
        ) : (
          <>
          <ul className="space-y-2.5 md:hidden">
            {posts.map((post) => (
              <li key={post.id}>
                <MobilePostRow
                  post={post}
                  extra={
                    (post.status !== "OPEN" || post._count.claims > 0) && (
                      <>
                        {post.status !== "OPEN" && (
                          <Badge tone={STATUS_TONES[post.status]}>
                            {POST_STATUS_LABELS[post.status]}
                          </Badge>
                        )}
                        {post._count.claims > 0 && (
                          <Badge tone="brand">
                            {post._count.claims} claim{post._count.claims === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </>
                    )
                  }
                />
              </li>
            ))}
          </ul>
          <ul className="mt-5 hidden space-y-2.5 md:block">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.id}`}
                  className="group flex items-center gap-4 rounded-card border border-line bg-raised p-4 shadow-card transition-all duration-150 hover:border-brand-border hover:shadow-raised"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={post.type === "FOUND" ? "found" : "lost"}>
                        {post.type === "FOUND" ? "Found" : "Lost"}
                      </Badge>
                      {post.status !== "OPEN" && (
                        <Badge tone={STATUS_TONES[post.status]}>
                          {POST_STATUS_LABELS[post.status]}
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-1.5 truncate font-medium text-ink transition-colors group-hover:text-brand-text">
                      {post.title}
                    </h2>
                    <p className="mt-1 text-sm text-subtle">
                      {LOCATION_LABELS[post.location]} · {formatDay(post.occurredOn)}
                      {post._count.claims > 0 &&
                        ` · ${post._count.claims} claim${post._count.claims === 1 ? "" : "s"}`}
                    </p>
                  </div>

                  {post.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.images[0].url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-[10px] object-cover"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
          </>
        )}

        {/* The desktop header carries the theme switch and the moderator link;
            the phone's tab bar has no room for either, so they live here. */}
        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-card border border-line bg-raised md:hidden">
          <li className="flex items-center justify-between px-4 py-2">
            <span className="text-[15px] text-ink">Appearance</span>
            <ThemeToggle />
          </li>
          {isModerator(user.email) && (
            <li>
              <Link href="/admin/reports" className="block px-4 py-3.5 text-[15px] text-ink">
                Moderation queue
              </Link>
            </li>
          )}
          <li>
            <form action={signOutAction}>
              <button type="submit" className="w-full px-4 py-3.5 text-left text-[15px] text-danger">
                Sign out
              </button>
            </form>
          </li>
        </ul>
      </main>
    </>
  );
}
