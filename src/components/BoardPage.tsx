import { Feed } from "@/components/Feed";
import { Header } from "@/components/Header";
import { MobileFeed } from "@/components/mobile/MobileFeed";
import { parseFeedParams } from "@/lib/feed-params";
import { getFeed } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import type { PostType } from "@/generated/prisma/enums";

/**
 * /lost, /found and /browse are the same page with a different filter on type.
 * One query feeds both layouts; each hides itself at the other's breakpoint.
 */
export async function BoardPage({
  type,
  basePath,
  searchParams,
}: {
  type?: PostType;
  basePath: "/lost" | "/found" | "/browse";
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser(basePath);
  const { filters, page } = parseFeedParams(searchParams);
  const feed = await getFeed(type, filters, page);
  const props = { type, basePath, filters, page, feed };

  return (
    <>
      <Header
        user={user}
        active={type === "LOST" ? "lost" : type === "FOUND" ? "found" : undefined}
      />
      <main id="main">
        <div className="mx-auto hidden w-full max-w-4xl px-4 py-6 md:block">
          <Feed {...props} />
        </div>
        <div className="md:hidden">
          <MobileFeed {...props} />
        </div>
      </main>
    </>
  );
}
