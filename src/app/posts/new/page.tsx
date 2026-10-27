import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { ChevronRightGlyph, Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { PostForm } from "./PostForm";

export const metadata: Metadata = { title: "New post · MacFound" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: rawType } = await searchParams;
  const chosen = rawType?.toLowerCase();

  // No type yet: ask. The phone's single Post button lands here, so the first
  // question is the one people actually think in — did I lose or find it?
  if (chosen !== "lost" && chosen !== "found") {
    const user = await requireUser("/posts/new");
    return (
      <>
        <Header user={user} />
        <main id="main" className="mx-auto w-full max-w-2xl px-4 py-6">
          <PageHeader title="New post" />
          <ul className="mt-5 space-y-3">
            <TypeChoice
              href="/posts/new?type=lost"
              title="I lost something"
              detail="Describe it and we'll watch for anyone who finds it."
            />
            <TypeChoice
              href="/posts/new?type=found"
              title="I found something"
              detail="Post it so the owner can claim it."
            />
          </ul>
        </main>
      </>
    );
  }

  const type = chosen === "found" ? "FOUND" : "LOST";
  const user = await requireUser(`/posts/new?type=${chosen}`);

  const isFound = type === "FOUND";
  const now = new Date();
  const today = now.toLocaleDateString("en-CA"); // yyyy-mm-dd, local
  const yesterday = new Date(now.getTime() - 86_400_000).toLocaleDateString("en-CA");

  return (
    <>
      <Header
        user={user}
        active={isFound ? "found" : "lost"}
        mobile={{ back: { href: "/posts/new", label: "Back" }, tabs: false }}
      />

      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:py-6">
        <Link
          href={isFound ? "/found" : "/lost"}
          className="hidden text-sm text-subtle transition-colors hover:text-ink md:inline-block"
        >
          ← Back to {isFound ? "found" : "lost"} items
        </Link>

        <h1 className="mb-5 text-[1.375rem] font-semibold text-ink md:mt-3 md:mb-6 md:text-title">
          {isFound ? "Post something you found" : "Report something you lost"}
        </h1>

        <PostForm type={type} today={today} yesterday={yesterday} />
      </main>
    </>
  );
}

function TypeChoice({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 rounded-card border border-line bg-raised p-5 shadow-card transition-colors hover:border-brand-border active:bg-sunken"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-sm text-muted">{detail}</span>
        </span>
        <Icon className="h-5 w-5 text-muted">
          <ChevronRightGlyph />
        </Icon>
      </Link>
    </li>
  );
}
