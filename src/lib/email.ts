import { Resend } from "resend";

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
