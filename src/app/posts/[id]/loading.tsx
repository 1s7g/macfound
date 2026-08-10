import { HeaderSkeleton, Skeleton } from "@/components/Skeleton";

/**
 * Mirrors the post page's content + sticky panel grid, including the explicit
 * row placement, so the real page drops in without anything moving.
 */
export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="deferred-skeleton mx-auto w-full max-w-4xl px-4 py-6">
        <Skeleton className="h-4 w-36" />

        <div className="mt-5 grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-9 w-3/4" />
            <Skeleton className="mt-3 h-4 w-40" />
            <div className="mt-6 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <aside className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="rounded-card border border-line bg-raised p-4">
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-card border border-line bg-raised p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-10 w-full rounded-control" />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
