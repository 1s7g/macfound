import type { Metadata } from "next";

import { BoardPage } from "@/components/BoardPage";

export const metadata: Metadata = { title: "Found items · MacFound" };

export default async function FoundPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <BoardPage type="FOUND" basePath="/found" searchParams={await searchParams} />;
}
