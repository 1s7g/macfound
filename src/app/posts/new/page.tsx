import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { CAMPUS_SAFETY, DROP_OFF_POINTS } from "@/lib/campus-safety";
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

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <Link
          href={isFound ? "/found" : "/lost"}
          className="text-sm text-stone-500 transition hover:text-stone-800"
        >
          ← Back to {isFound ? "found" : "lost"} items
        </Link>

        <h1 className="mt-3 text-xl font-semibold tracking-tight text-stone-900">
          {isFound ? "Post something you found" : "Report something you lost"}
        </h1>
        <p className="mt-1 mb-6 text-sm leading-relaxed text-stone-600">
          {isFound
            ? "Describe it well enough that the owner recognises it — but hold back one detail for the verification field."
            : "The more specific you are, the better the odds someone recognises it."}
        </p>

        <PostForm
          type={type}
          today={today}
          nearestDropOffHint={
            isFound
              ? `Don't want to hold onto it? There are ${DROP_OFF_POINTS.length} official drop boxes on campus, and ${CAMPUS_SAFETY.name} keeps items for ${CAMPUS_SAFETY.retentionDays} days. Posting here first still helps — you'll be notified if it matches someone's lost report.`
              : undefined
          }
        />
      </main>
    </>
  );
}
