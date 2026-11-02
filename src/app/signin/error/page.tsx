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
  // Auth.js reports both a non-McMaster address and a banned one as
  // AccessDenied, with nothing to tell them apart here, so this covers both.
  AccessDenied: {
    title: "You can't sign in with this address",
    body: "MacFound is only open to McMaster students, so you'll need an @mcmaster.ca address. If you used your McMaster email, this account may have been suspended.",
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
  const contact = process.env.CONTACT_EMAIL;

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-muted">{body}</p>
      {(reason ?? error) === "AccessDenied" && contact && (
        <p className="mt-3 text-sm text-muted">
          Think this is a mistake? Email{" "}
          <a href={`mailto:${contact}`} className="font-medium text-brand-text underline underline-offset-2">
            {contact}
          </a>
          .
        </p>
      )}

      <Link
        href="/signin"
        className="mt-6 inline-flex w-full items-center justify-center rounded-control bg-brand px-4 py-2.5 font-medium text-on-brand shadow-card transition hover:bg-brand-hover sm:w-auto sm:self-start"
      >
        Back to sign in
      </Link>
    </main>
  );
}
