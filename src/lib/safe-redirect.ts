/**
 * Sanitise a user-supplied redirect target.
 *
 * `?next=` flows into the sign-in callbackUrl, so an unchecked value is an open
 * redirect: an attacker sends a student to /signin?next=https://evil.example,
 * they sign in legitimately, and get bounced to a convincing fake. Only
 * same-origin absolute paths are allowed through.
 *
 * "//evil.example" is rejected explicitly — it starts with "/" but browsers
 * read it as protocol-relative and navigate off-site.
 */
export function safeRedirect(value: string | undefined, fallback = "/lost"): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}
