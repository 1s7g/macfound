import { db } from "@/lib/db";

/**
 * Numbers for the private stats page: is anyone using this, and is it working?
 *
 * "Working" means items going back to their owners, so reunions and approved
 * claims sit beside the raw sign-up count — a thousand accounts and no
 * reunions would be a failure, and ten accounts with three reunions wouldn't.
 *
 * Days are counted in Toronto time. Timestamps are stored as UTC without a
 * zone, so each one is read as UTC and then shifted; counting in UTC would
 * put an evening sign-up on the next day.
 */

export const STATS_DAYS = 30;
const ZONE = "America/Toronto";

export type DailyRow = { day: string; accounts: number; posts: number; reunited: number };

export async function getStats() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const dayAgo = new Date(Date.now() - 86_400_000);

  const [
    accounts,
    accountsThisWeek,
    accountsToday,
    signedIn,
    posts,
    openPosts,
    lostPosts,
    reunited,
    claims,
    approvedClaims,
    conversations,
    messages,
    daily,
    recentAccounts,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: dayAgo } } }),
    db.session
      .findMany({ where: { expires: { gt: new Date() } }, distinct: ["userId"], select: { userId: true } })
      .then((rows) => rows.length),
    db.post.count(),
    db.post.count({ where: { status: "OPEN" } }),
    db.post.count({ where: { type: "LOST" } }),
    db.post.count({ where: { status: "RESOLVED" } }),
    db.claim.count(),
    db.claim.count({ where: { status: "APPROVED" } }),
    db.conversation.count(),
    db.message.count(),
    db.$queryRaw<DailyRow[]>`
      WITH days AS (
        SELECT generate_series(
          (now() AT TIME ZONE ${ZONE})::date - ${STATS_DAYS - 1}::int,
          (now() AT TIME ZONE ${ZONE})::date,
          interval '1 day'
        )::date AS day
      )
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS day,
        (SELECT count(*) FROM "User" u
           WHERE ((u."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${ZONE})::date = d.day)::int AS accounts,
        (SELECT count(*) FROM "Post" p
           WHERE ((p."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${ZONE})::date = d.day)::int AS posts,
        (SELECT count(*) FROM "Post" p
           WHERE p.status = 'RESOLVED' AND p."resolvedAt" IS NOT NULL
             AND ((p."resolvedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${ZONE})::date = d.day)::int AS reunited
      FROM days d
      ORDER BY d.day
    `,
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  return {
    accounts,
    accountsThisWeek,
    accountsToday,
    signedIn,
    posts,
    openPosts,
    lostPosts,
    foundPosts: posts - lostPosts,
    reunited,
    claims,
    approvedClaims,
    conversations,
    messages,
    daily,
    recentAccounts,
  };
}
