import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { Badge, type BadgeTone, Button, ButtonLink, EmptyState, PageHeader } from "@/components/ui";
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

  return (
    <>
      <Header user={user} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
        <PageHeader
          title={user.name ?? user.email}
          subtitle={
            posts.length === 0 ? user.email : `${open} open · ${reunited} reunited`
          }
          action={
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          }
        />

        {posts.length === 0 ? (
          <div className="mt-5">
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
          <ul className="mt-5 space-y-2.5">
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
                      {post._count.comments > 0 &&
                        ` · ${post._count.comments} repl${post._count.comments === 1 ? "y" : "ies"}`}
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
        )}
      </main>
    </>
  );
}
