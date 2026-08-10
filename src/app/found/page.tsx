import type { Metadata } from "next";

import { Feed } from "@/components/Feed";
import { Header } from "@/components/Header";
import { parseFeedParams } from "@/lib/feed-params";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Found items · MacFound" };

export default async function FoundPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/found");
  const { filters, page } = parseFeedParams(await searchParams);

  return (
    <>
      <Header user={user} active="found" />
      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
        <Feed type="FOUND" basePath="/found" filters={filters} page={page} />
      </main>
    </>
  );
}
