import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Header } from "@/components/Header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { EditForm } from "./EditForm";

export const metadata: Metadata = { title: "Edit post · MacFound" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/posts/${id}/edit`);

  const post = await db.post.findUnique({
    where: { id },
    select: {
      id: true, type: true, title: true, description: true, category: true,
      location: true, locationDetail: true, occurredOn: true, authorId: true, status: true,
      handedInAt: true,
    },
  });

  if (!post) notFound();
  // Ownership check on the page as well as in the action: no point rendering a
  // form that will be rejected.
  if (post.authorId !== user.id) redirect(`/posts/${post.id}`);

  return (
    <>
      <Header
        user={user}
        active={post.type === "FOUND" ? "found" : "lost"}
        mobile={{ back: { href: `/posts/${post.id}`, label: "Post" }, tabs: false }}
      />
      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:py-6">
        <Link
          href={`/posts/${post.id}`}
          className="hidden text-sm text-subtle transition hover:text-ink md:inline"
        >
          ← Back to post
        </Link>
        <h1 className="mb-5 text-[1.375rem] font-semibold text-ink md:mt-3 md:mb-6 md:text-title">
          Edit your post
        </h1>
        <EditForm
          post={{
            ...post,
            occurredOn: post.occurredOn.toLocaleDateString("en-CA"),
          }}
          today={new Date().toLocaleDateString("en-CA")}
        />
      </main>
    </>
  );
}
