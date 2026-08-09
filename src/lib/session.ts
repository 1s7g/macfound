import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * The signed-in user, or null.
 *
 * Auth.js types `session.user` loosely (everything optional), which makes every
 * caller re-check the same fields. This narrows once, here.
 */
export async function getUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
  };
}

/**
 * The signed-in user, redirecting to sign-in if there isn't one.
 *
 * Every page behind the login wall calls this. Feeds are gated too, not just
 * posting: restricting the whole app to verified McMaster accounts is what
 * stops the listings becoming a shopping catalogue for people who aren't
 * students. `next` preserves where they were headed.
 */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getUser();
  if (user) return user;

  redirect(returnTo ? `/signin?next=${encodeURIComponent(returnTo)}` : "/signin");
}
