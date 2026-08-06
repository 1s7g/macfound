import { db } from "@/lib/db";

/**
 * Fixed-window rate limiting on top of Postgres.
 *
 * Deliberately not an in-memory Map: on Vercel each request may hit a different
 * serverless instance, so a process-local counter would enforce nothing. The
 * database is the only shared state we have, and these checks are cheap
 * (single-row upsert on a primary key).
 *
 * Fixed windows allow a burst at a window boundary (up to 2x the limit across
 * two adjacent windows). That's an accepted trade for the simplicity; the
 * limits below are set low enough that the burst is still harmless.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Record one use of `key` and report whether it is within `limit` per `windowSeconds`.
 * Always call this *before* doing the protected work.
 */
export async function consume(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

  // One statement, so concurrent requests can't both read a stale count and
  // each decide they're under the limit. On conflict we either start a fresh
  // window (previous one expired) or increment the existing one.
  const [row] = await db.$queryRaw<{ count: number; expiresAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${windowEnd})
    ON CONFLICT ("key") DO UPDATE SET
      "count"     = CASE WHEN "RateLimit"."expiresAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= ${now} THEN ${windowEnd} ELSE "RateLimit"."expiresAt" END
    RETURNING "count", "expiresAt"
  `;

  const allowed = row.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

/** Clear a key early — used after a successful sign-in so a valid login resets the counter. */
export async function reset(key: string): Promise<void> {
  await db.rateLimit.deleteMany({ where: { key } });
}

/** Housekeeping for expired windows. Safe to call from a cron job. */
export async function pruneExpired(): Promise<number> {
  const { count } = await db.rateLimit.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return count;
}

// --- Policies -------------------------------------------------------------
// Named in one place so the numbers are reviewable rather than scattered.

export const POLICY = {
  /** Requesting a sign-in code, per email address. */
  signInRequestPerEmail: { limit: 5, windowSeconds: 15 * 60 },
  /** Requesting a sign-in code, per IP — stops enumeration across many addresses. */
  signInRequestPerIp: { limit: 20, windowSeconds: 15 * 60 },
  /**
   * Verifying a sign-in code, per email. This is the one that makes a 6-digit
   * code safe: 6 attempts per 15 minutes caps a brute-force attempt at roughly
   * 576 guesses per day against 1,000,000 possibilities.
   */
  signInVerifyPerEmail: { limit: 6, windowSeconds: 15 * 60 },
} as const;

export function signInRequestKey(email: string) {
  return `signin:request:${email.toLowerCase()}`;
}
export function signInRequestIpKey(ip: string) {
  return `signin:request:ip:${ip}`;
}
export function signInVerifyKey(email: string) {
  return `signin:verify:${email.toLowerCase()}`;
}
