import type { Metadata } from "next";

import { BoardPage } from "@/components/BoardPage";

export const metadata: Metadata = { title: "Lost items · MacFound" };

export default async function LostPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <BoardPage type="LOST" basePath="/lost" searchParams={await searchParams} />;
}
