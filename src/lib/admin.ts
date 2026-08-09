/**
 * Moderator access.
 *
 * A single env var rather than a role column: there is exactly one moderator
 * (you), and adding a permissions system for that is theatre. When there's a
 * second moderator, this becomes a column and the call sites don't change.
 *
 * ADMIN_EMAILS is a comma-separated list.
 */
export function isModerator(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}
