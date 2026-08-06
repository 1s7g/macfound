import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ALLOWED_EMAIL_DOMAIN, auth } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in · MacFound",
  description: "Sign in with your McMaster email to post lost and found items.",
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          MacFound
        </h1>
        <p className="mt-1 text-stone-600">
          Lost &amp; found for McMaster. Sign in to post or claim an item.
        </p>
      </div>

      <SignInForm domain={ALLOWED_EMAIL_DOMAIN} />

      <p className="mt-8 text-center text-xs leading-relaxed text-stone-500">
        A student project, not affiliated with or endorsed by McMaster
        University.
      </p>
    </main>
  );
}
