import { Resend } from "resend";

import { describeError, sendAlert } from "@/lib/alerts";

/**
 * Email delivery.
 *
 * In development, with no AUTH_RESEND_KEY set, sign-in codes are printed to the
 * terminal instead of sent. That keeps the whole auth flow testable with no
 * external account, no API key, and no waiting on inbox delivery — you read the
 * code off the dev server output and paste it in.
 *
 * Set AUTH_RESEND_KEY to switch to real delivery. Production refuses to start
 * the flow without it rather than silently logging codes to a server log.
 */

const resendKey = process.env.AUTH_RESEND_KEY;
const from = process.env.EMAIL_FROM ?? "MacFound <login@example.com>";
const isProduction = process.env.NODE_ENV === "production";

const resend = resendKey ? new Resend(resendKey) : null;

export async function sendSignInCode(to: string, code: string): Promise<void> {
  if (!resend) {
    if (isProduction) {
      await sendAlert(
        "Sign-in emails are failing",
        "AUTH_RESEND_KEY is not set in production, so no sign-in codes can be sent.",
        "signin-email",
      );
      throw new Error(
        "AUTH_RESEND_KEY is not set — refusing to log sign-in codes in production.",
      );
    }

    // Deliberately loud: this is the only place the code appears in dev.
    console.log(
      [
        "",
        "  ┌─────────────────────────────────────────────┐",
        "  │  MacFound sign-in code (dev only)           │",
        "  ├─────────────────────────────────────────────┤",
        `  │  to:    ${to.padEnd(36)}│`,
        `  │  code:  ${code.padEnd(36)}│`,
        "  └─────────────────────────────────────────────┘",
        "",
      ].join("\n"),
    );
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${code} is your MacFound sign-in code`,
    text: [
      `Your MacFound sign-in code is ${code}`,
      "",
      "It expires in 10 minutes and can only be used once.",
      "If you didn't request this, you can ignore this email.",
    ].join("\n"),
    html: signInCodeHtml(code),
  });

  if (error) {
    // Surface a generic failure upward; the caller must not leak whether the
    // address exists or why delivery failed.
    console.error("Failed to send sign-in code:", error);
    // Nobody can sign in while this is failing, and the student only sees a
    // generic message — so the maintainer has to hear about it.
    await sendAlert("Sign-in emails are failing", describeError(error), "signin-email");
    throw new Error("Could not send sign-in email.");
  }
}

function signInCodeHtml(code: string): string {
  return `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
  <h1 style="font-size:20px;margin:0 0 8px">MacFound</h1>
  <p style="margin:0 0 24px;color:#555">Lost &amp; found for McMaster</p>
  <p style="margin:0 0 12px">Your sign-in code is:</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:0 0 24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${code}</p>
  <p style="margin:0 0 8px;color:#555;font-size:14px">This code expires in 10 minutes and can only be used once.</p>
  <p style="margin:0;color:#555;font-size:14px">If you didn't request it, you can safely ignore this email.</p>
</div>`.trim();
}

// --- Notification emails ---------------------------------------------------

/**
 * Where links in emails point. Production uses the project's stable domain,
 * previews their own deployment, and local development the dev server — so a
 * link clicked from a test email never lands on the live site by accident.
 */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type NotificationEmail = {
  to: string;
  subject: string;
  /** One or two plain sentences; user-written text is escaped before use. */
  lines: string[];
  action: { label: string; href: string };
};

/**
 * Send one notification email. Never throws: a failed email must not undo the
 * claim, message or post that triggered it — the in-app notification already
 * exists, so the worst case is a missed nudge, logged for us to see.
 */
export async function sendNotificationEmail(email: NotificationEmail): Promise<void> {
  const url = `${appUrl()}${email.action.href}`;

  if (!resend) {
    console.log(`[email, dev only] to ${email.to}: ${email.subject} → ${url}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: email.to,
      subject: email.subject,
      text: [
        ...email.lines,
        "",
        `${email.action.label}: ${url}`,
        "",
        `Change which emails you get: ${appUrl()}/me`,
      ].join("\n"),
      html: notificationHtml(email.lines, email.action.label, url),
    });
    if (error) {
      console.error("Notification email failed:", error);
      await sendAlert("Notification emails are failing", describeError(error), "notification-email");
    }
  } catch (error) {
    console.error("Notification email failed:", error);
    await sendAlert("Notification emails are failing", describeError(error), "notification-email");
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function notificationHtml(lines: string[], label: string, url: string): string {
  const paragraphs = lines
    .map((line) => `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(line)}</p>`)
    .join("");
  return `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
  <h1 style="font-size:20px;margin:0 0 24px">MacFound</h1>
  ${paragraphs}
  <p style="margin:24px 0">
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#7A003C;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${escapeHtml(label)}</a>
  </p>
  <p style="margin:24px 0 0;color:#666;font-size:13px">
    You're getting this because you use MacFound.
    <a href="${escapeHtml(`${appUrl()}/me`)}" style="color:#666">Change which emails you get</a>.
  </p>
</div>`.trim();
}
