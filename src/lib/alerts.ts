import { Resend } from "resend";

/**
 * Tell the maintainer something is broken, before a student does.
 *
 * Vercel's free plan has no alerting and keeps only half an hour of logs, so a
 * failure nobody reports is a failure nobody sees. The case that prompted this:
 * Resend rejected every sign-in email for a while, each student just saw
 * "couldn't send", and the only trace was a log line that expired unread.
 *
 * Two channels, because the thing that breaks might be one of them:
 *   - a Discord webhook (DISCORD_ALERT_WEBHOOK), which doesn't depend on our
 *     mail provider and pings a phone immediately;
 *   - email via Resend to ALERT_EMAIL (or CONTACT_EMAIL), as a backup.
 *
 * Each alert key fires at most once per window, so one broken page hit a
 * thousand times is one message, not a thousand. Never throws: reporting an
 * error must not become a second error.
 */

const WINDOW_MS = 30 * 60 * 1000;

// Per-instance memory, used first so a burst inside one function instance
// doesn't even reach the database. Instances don't share memory, so the
// database check below is what makes the limit hold across them.
const lastSent = new Map<string, number>();

export async function sendAlert(
  title: string,
  detail: string,
  key: string = title,
): Promise<void> {
  try {
    const isProduction = process.env.VERCEL_ENV === "production";
    const webhook = process.env.DISCORD_ALERT_WEBHOOK;
    const email = process.env.ALERT_EMAIL ?? process.env.CONTACT_EMAIL;

    console.error(`[alert] ${title}\n${detail}`);

    // Locally and on previews, only alert when a webhook is deliberately set
    // for testing — not every dev-server typo should ping a phone.
    if (!isProduction && !webhook) return;

    if (!(await shouldSend(key))) return;

    const environment = process.env.VERCEL_ENV ?? "local";
    const body = `${title}\n\n${detail}`.slice(0, 1800);

    await Promise.allSettled([
      webhook ? sendToDiscord(webhook, environment, body) : Promise.resolve(),
      isProduction && email ? sendEmail(email, title, body) : Promise.resolve(),
    ]);
  } catch (error) {
    console.error("[alert] could not deliver alert", error);
  }
}

async function shouldSend(key: string): Promise<boolean> {
  const now = Date.now();
  const previous = lastSent.get(key);
  if (previous && now - previous < WINDOW_MS) return false;
  lastSent.set(key, now);

  try {
    // Imported lazily: alerts are reported from places (instrumentation, the
    // email module) that shouldn't pull the database client in at load time.
    const { consume } = await import("@/lib/rate-limit");
    const result = await consume(`alert:${key}`.slice(0, 190), 1, WINDOW_MS / 1000);
    return result.allowed;
  } catch {
    // The database may be the thing that's down. Fall back to this
    // instance's memory rather than staying silent about it.
    return true;
  }
}

async function sendToDiscord(webhook: string, environment: string, body: string) {
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "MacFound alerts",
      content: `**[${environment}]** ${body}`.slice(0, 2000),
      allowed_mentions: { parse: [] },
    }),
  });
}

async function sendEmail(to: string, title: string, body: string) {
  const key = process.env.AUTH_RESEND_KEY;
  if (!key) return;
  const from = process.env.EMAIL_FROM ?? "MacFound <login@example.com>";
  await new Resend(key).emails.send({
    from,
    to,
    subject: `[MacFound alert] ${title}`.slice(0, 150),
    text: body,
  });
}

/** A short, log-safe description of anything thrown. */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const digest = "digest" in error ? ` (digest ${String(error.digest)})` : "";
    return `${error.name}: ${error.message}${digest}`;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
