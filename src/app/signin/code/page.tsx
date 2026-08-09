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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Check your email
        </h1>
        <p className="mt-1 text-stone-600">
          We sent a 6-digit code to <span className="font-medium text-stone-900">{email}</span>.
          It expires in 10 minutes.
        </p>
      </div>

      <form action="/api/auth/callback/mcmaster" method="GET" className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="callbackUrl" value={next} />

        <div>
          <label htmlFor="token" className="mb-1.5 block text-sm font-medium text-stone-700">
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
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-center font-mono text-2xl tracking-[0.4em] text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            That code wasn&rsquo;t right or has expired. Check the latest email and try again.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Didn&rsquo;t get it? Check spam, or{" "}
        <Link href="/signin" className="font-medium text-brand underline underline-offset-2">
          try a different address
        </Link>
        .
      </p>
    </main>
  );
}
