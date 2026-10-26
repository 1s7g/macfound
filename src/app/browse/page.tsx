import type { Metadata } from "next";

import { BoardPage } from "@/components/BoardPage";

export const metadata: Metadata = { title: "Browse · MacFound" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <BoardPage basePath="/browse" searchParams={await searchParams} />;
}
