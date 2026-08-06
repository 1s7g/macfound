import { randomInt } from "node:crypto";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "next-auth/providers";

import { db } from "@/lib/db";
import { sendSignInCode } from "@/lib/email";

/**
 * Authentication: a 6-digit code emailed to a McMaster address.
 *
 * Why codes and not magic links: students are overwhelmingly on phones, and a
 * magic link opened from the Gmail or Outlook app lands in an in-app browser.
 * The session cookie gets set there, then the user switches to Safari or Chrome
 * and appears logged out. A code they read and type works in whichever browser
 * they actually started in.
 *
 * Why email at all: real McMaster SSO isn't available to a student project, but
 * possession of an @mcmaster.ca inbox proves affiliation just as well, and that
 * is the entire trust model this app rests on.
 */

export const ALLOWED_EMAIL_DOMAIN = (
  process.env.ALLOWED_EMAIL_DOMAIN ?? "mcmaster.ca"
).toLowerCase();

/** Codes are short-lived; combined with the verify rate limit this makes 6 digits safe. */
const CODE_TTL_SECONDS = 10 * 60;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The single source of truth for who may hold an account. */
export function isAllowedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  // Exact-suffix check. Note the leading "@": a naive endsWith(domain) would
  // also accept "attacker@evilmcmaster.ca".
  return normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/**
 * Cryptographically random 6-digit code.
 * randomInt, not Math.random — predictable codes would defeat the whole flow.
 */
function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

const mcmasterEmailProvider: Provider = {
  id: "mcmaster",
  type: "email",
  name: "McMaster Email",
  from: process.env.EMAIL_FROM ?? "MacFound <login@example.com>",
  maxAge: CODE_TTL_SECONDS,
  options: {},
  generateVerificationToken: generateCode,
  async sendVerificationRequest({ identifier, token }) {
    // Defence in depth. The sign-in server action already checks the domain and
    // the rate limit, but this runs on every code send regardless of caller, so
    // a future code path can't accidentally bypass the restriction.
    if (!isAllowedEmail(identifier)) {
      throw new Error("Only McMaster email addresses may sign in.");
    }
    await sendSignInCode(identifier, token);
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [mcmasterEmailProvider],
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/code",
    error: "/signin/error",
  },
  callbacks: {
    /** Final gate — rejects a non-McMaster address even if one reached this far. */
    signIn({ user, email }) {
      // `email.verificationRequest` means this call is the *send* step, not the
      // verify step; both must be blocked for a disallowed address.
      void email;
      return Boolean(user.email && isAllowedEmail(user.email));
    },
    session({ session, user }) {
      // Expose the database id so server components can query by it directly.
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    /** Give new accounts a display name derived from their MacID. */
    async createUser({ user }) {
      if (user.name || !user.email) return;
      const macId = user.email.split("@")[0];
      await db.user.update({ where: { id: user.id }, data: { name: macId } });
    },
  },
});
