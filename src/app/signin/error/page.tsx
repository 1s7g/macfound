import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign-in problem · MacFound",
};

// Auth.js sends its own `error` codes; our wrapped callback adds `reason`.
const MESSAGES: Record<string, { title: string; body: string }> = {
  "too-many-attempts": {
    title: "Too many attempts",
    body: "That's a lot of wrong codes. For your account's safety we've paused sign-in for about 15 minutes. Request a fresh code after that.",
  },
  Verification: {
    title: "That code didn't work",
    body: "Codes expire after 10 minutes and can only be used once. Request a new one and try again.",
  },
  AccessDenied: {
    title: "McMaster email required",
    body: "MacFound is only open to McMaster students, so you'll need an @mcmaster.ca address to sign in.",
  },
};

const FALLBACK = {
  title: "Something went wrong",
  body: "We couldn't finish signing you in. Please try again.",
};

export default async function SignInErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; error?: string }>;
}) {
  const { reason, error } = await searchParams;
  const { title, body } = MESSAGES[reason ?? error ?? ""] ?? FALLBACK;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
      <p className="mt-2 text-stone-600">{body}</p>

      <Link
        href="/signin"
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-dark"
      >
        Back to sign in
      </Link>
    </main>
  );
}
