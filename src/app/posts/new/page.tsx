import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { requireUser } from "@/lib/session";
import { PostForm } from "./PostForm";

export const metadata: Metadata = { title: "New post · MacFound" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: rawType } = await searchParams;
  const type = rawType?.toLowerCase() === "found" ? "FOUND" : "LOST";
  const user = await requireUser(`/posts/new?type=${type.toLowerCase()}`);

  const isFound = type === "FOUND";
  const today = new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd, local

  return (
    <>
      <Header user={user} active={isFound ? "found" : "lost"} />

      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-6">
        <Link
          href={isFound ? "/found" : "/lost"}
          className="text-sm text-subtle transition hover:text-ink"
        >
          ← Back to {isFound ? "found" : "lost"} items
        </Link>

        <h1 className="mt-3 mb-6 text-xl font-semibold tracking-tight text-ink">
          {isFound ? "Post something you found" : "Report something you lost"}
        </h1>

        <PostForm type={type} today={today} />
      </main>
    </>
  );
}
