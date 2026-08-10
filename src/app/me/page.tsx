import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { getMyPosts } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { CATEGORY_LABELS, LOCATION_LABELS, POST_STATUS_LABELS } from "@/lib/vocabulary";

export const metadata: Metadata = { title: "Your posts · MacFound" };

const STATUS_STYLES = {
  OPEN: "bg-sunken text-ink",
  RESOLVED: "bg-brand text-white",
  EXPIRED: "bg-sunken text-subtle",
  REMOVED: "bg-danger-subtle text-danger",
} as const;

export default async function MyPostsPage() {
  const user = await requireUser("/me");
  const posts = await getMyPosts(user.id);

  const open = posts.filter((p) => p.status === "OPEN").length;
  const reunited = posts.filter((p) => p.status === "RESOLVED").length;

  return (
    <>
      <Header user={user} />

      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Your posts</h1>
        <p className="mt-0.5 text-sm text-subtle">
          {posts.length === 0
            ? "Nothing yet."
            : `${posts.length} total · ${open} open · ${reunited} reunited`}
        </p>

        {posts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-raised p-8 text-center">
            <p className="text-muted">You haven&rsquo;t posted anything yet.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/posts/new?type=lost" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover">
                Report something lost
              </Link>
              <Link href="/posts/new?type=found" className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-ink transition hover:bg-sunken">
                Post something found
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-line bg-raised p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status]}`}>
                        {POST_STATUS_LABELS[post.status]}
                      </span>
                      <span className="text-xs text-subtle">
                        {post.type === "FOUND" ? "Found" : "Lost"} · {CATEGORY_LABELS[post.category]}
                      </span>
                    </div>

                    <Link href={`/posts/${post.id}`} className="mt-1.5 block truncate font-medium text-ink hover:underline">
                      {post.title}
                    </Link>

                    <p className="mt-1 text-xs text-subtle">
                      {LOCATION_LABELS[post.location]} · posted {formatDay(post.createdAt)}
                      {post._count.claims > 0 && ` · ${post._count.claims} claim${post._count.claims === 1 ? "" : "s"}`}
                      {post._count.comments > 0 && ` · ${post._count.comments} repl${post._count.comments === 1 ? "y" : "ies"}`}
                    </p>
                  </div>

                  {post.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.images[0].url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                </div>

                {post.status === "OPEN" && (
                  <div className="mt-3 flex gap-3 border-t border-line pt-3 text-sm">
                    <Link href={`/posts/${post.id}/edit`} className="font-medium text-brand-text hover:underline">
                      Edit
                    </Link>
                    <Link href={`/posts/${post.id}`} className="text-subtle hover:text-ink">
                      Manage
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
