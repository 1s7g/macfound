import { deleteUserAndContent } from "@/lib/accounts";
import { isModerator } from "@/lib/admin";
import { db } from "@/lib/db";

/**
 * Banned addresses.
 *
 * A ban is enforced at every step of signing in — requesting a code, sending
 * it, and redeeming it — and banning someone who is signed in deletes their
 * sessions, so it takes effect immediately rather than when a cookie expires.
 */

// Same normalisation as lib/auth's normalizeEmail. Not imported from there,
// because auth imports this module to enforce bans at sign-in.
const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function isBanned(email: string): Promise<boolean> {
  const row = await db.bannedEmail.findUnique({
    where: { email: normalizeEmail(email) },
    select: { email: true },
  });
  return row !== null;
}

export type BanResult = { ok: true; deletedAccount: boolean } | { ok: false; error: string };

export async function banEmail(input: {
  email: string;
  reason?: string;
  bannedBy: string;
  deleteAccount: boolean;
}): Promise<BanResult> {
  const email = normalizeEmail(input.email);

  if (!email.includes("@")) return { ok: false, error: "That isn't an email address." };
  // A moderator can't lock themselves (or another moderator) out by mistake —
  // removing one is a change to ADMIN_EMAILS, not a ban.
  if (isModerator(email)) return { ok: false, error: "Moderators can't be banned." };

  await db.bannedEmail.upsert({
    where: { email },
    create: { email, reason: input.reason?.trim() || null, bannedBy: input.bannedBy },
    update: { reason: input.reason?.trim() || null, bannedBy: input.bannedBy },
  });

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { ok: true, deletedAccount: false };

  if (input.deleteAccount) {
    await deleteUserAndContent(user.id);
    return { ok: true, deletedAccount: true };
  }

  // Keeping their posts (say, for a moderator to review): just sign them out
  // everywhere, and unredeemed codes stop working too.
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  return { ok: true, deletedAccount: false };
}

export async function unbanEmail(email: string): Promise<void> {
  await db.bannedEmail.deleteMany({ where: { email: normalizeEmail(email) } });
}

export async function listBans() {
  return db.bannedEmail.findMany({ orderBy: { createdAt: "desc" } });
}

/** Accounts for the moderator's user list: search by name or email, newest first. */
export async function searchUsers(query: string | undefined, take = 25) {
  const q = query?.trim();
  return db.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });
}
