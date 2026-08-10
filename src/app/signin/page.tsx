import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ALLOWED_EMAIL_DOMAIN, auth } from "@/lib/auth";
import { safeRedirect } from "@/lib/safe-redirect";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in · MacFound",
  description: "Sign in with your McMaster email to post lost and found items.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeRedirect((await searchParams).next);
  const session = await auth();
  if (session?.user) redirect(next);

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          MacFound
        </h1>
        <p className="mt-1.5 text-muted">
          Sign in to post or claim an item.
        </p>
      </div>

      <SignInForm domain={ALLOWED_EMAIL_DOMAIN} next={next} />

      <p className="mt-8 text-center text-xs leading-relaxed text-subtle">
        A student project, not affiliated with or endorsed by McMaster
        University.
      </p>
    </main>
  );
}
