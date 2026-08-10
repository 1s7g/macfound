import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, isAllowedEmail, normalizeEmail } from "@/lib/auth";
import { safeRedirect } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Enter your code · MacFound",
};

/**
 * Code entry.
 *
 * This is a plain GET form pointed straight at the Auth.js callback, which is
 * exactly the URL a magic link would have hit. No client JavaScript is involved
 * in redeeming a code — the flow still works with JS disabled or still loading,
 * which matters on a phone on campus wifi.
 */
export default async function EnterCodePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
}) {
  const { email: rawEmail, error, next: rawNext } = await searchParams;
  const next = safeRedirect(rawNext);

  const session = await auth();
  if (session?.user) redirect(next);
  const email = rawEmail ? normalizeEmail(rawEmail) : "";

  // Don't render a verification form for an address that could never sign in.
  if (!email || !isAllowedEmail(email)) redirect("/signin");

  // Mirrors the condition in lib/email.ts that logs the code instead of sending
  // it. Without this notice the page says "check your email" while the code is
  // sitting in a terminal — which is exactly how a real dev session got stuck.
  const isDevMailFallback =
    process.env.NODE_ENV !== "production" && !process.env.AUTH_RESEND_KEY;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {isDevMailFallback ? "Enter your code" : "Check your email"}
        </h1>
        <p className="mt-1 text-muted">
          {isDevMailFallback ? (
            <>
              A 6-digit code was generated for{" "}
              <span className="font-medium text-ink">{email}</span>. It
              expires in 10 minutes.
            </>
          ) : (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-ink">{email}</span>. It
              expires in 10 minutes.
            </>
          )}
        </p>
      </div>

      {isDevMailFallback && (
        <p className="mb-5 rounded-lg border border-line bg-sunken px-4 py-3 text-sm leading-relaxed text-ink">
          <strong className="font-medium">Development mode.</strong> No email was
          sent — your code was printed in the terminal running{" "}
          <code className="rounded bg-sunken px-1 py-0.5 font-mono text-xs">npm run dev</code>.
          Set <code className="rounded bg-sunken px-1 py-0.5 font-mono text-xs">AUTH_RESEND_KEY</code>{" "}
          to send real email locally.
        </p>
      )}

      <form action="/api/auth/callback/mcmaster" method="GET" className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="callbackUrl" value={next} />

        <div>
          <label htmlFor="token" className="mb-1.5 block text-sm font-medium text-ink">
            Sign-in code
          </label>
          <input
            id="token"
            name="token"
            type="text"
            required
            autoFocus
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="000000"
            className="w-full rounded-control border border-line-strong bg-raised px-3.5 py-2.5 text-center font-mono text-2xl tracking-[0.4em] text-ink outline-none transition placeholder:text-subtle focus:border-brand"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            That code wasn&rsquo;t right or has expired. Check the latest email and try again.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-control bg-brand px-4 py-2.5 font-medium text-on-brand shadow-card transition hover:bg-brand-hover"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-subtle">
        {isDevMailFallback ? "Can't find it in the terminal? " : "Didn't get it? Check spam, or "}
        <Link href="/signin" className="font-medium text-brand-text underline underline-offset-2">
          {isDevMailFallback ? "request a new code" : "try a different address"}
        </Link>
        .
      </p>
    </main>
  );
}
