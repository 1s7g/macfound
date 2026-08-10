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
    },
  });

  if (!post) notFound();
  // Ownership check on the page as well as in the action: no point rendering a
  // form that will be rejected.
  if (post.authorId !== user.id) redirect(`/posts/${post.id}`);

  return (
    <>
      <Header user={user} active={post.type === "FOUND" ? "found" : "lost"} />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <Link href={`/posts/${post.id}`} className="text-sm text-subtle transition hover:text-ink">
          ← Back to post
        </Link>
        <h1 className="mt-3 mb-6 text-xl font-semibold tracking-tight text-ink">
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
