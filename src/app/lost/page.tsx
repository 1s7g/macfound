import type { Metadata } from "next";

import { Feed } from "@/components/Feed";
import { Header } from "@/components/Header";
import { parseFeedParams } from "@/lib/feed-params";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Lost items · MacFound" };

export default async function LostPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/lost");
  const { filters, page } = parseFeedParams(await searchParams);

  return (
    <>
      <Header user={user} active="lost" />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <Feed type="LOST" basePath="/lost" filters={filters} page={page} />
      </main>
    </>
  );
}
