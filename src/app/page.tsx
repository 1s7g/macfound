import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { CAMPUS_SAFETY } from "@/lib/campus-safety";

// Placeholder home. Replaced by the Lost/Found feeds in the next step — for now
// it exists to prove the session round-trips correctly.
export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">MacFound</h1>
      <p className="mt-2 text-stone-600">Lost &amp; found for McMaster.</p>

      {session?.user ? (
        <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-stone-900">
            Signed in as <span className="font-medium">{session.user.email}</span>
          </p>
          <p className="mt-1 text-sm text-stone-500">User id: {session.user.id}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="mt-4 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <Link
          href="/signin"
          className="mt-8 inline-flex rounded-lg bg-brand px-5 py-2.5 font-medium text-white transition hover:bg-brand-dark"
        >
          Sign in with McMaster email
        </Link>
      )}

      <p className="mt-10 border-t border-stone-200 pt-6 text-sm leading-relaxed text-stone-500">
        Looking for something already handed in? McMaster&rsquo;s official lost
        &amp; found is {CAMPUS_SAFETY.name}, {CAMPUS_SAFETY.building} — they hold
        items for {CAMPUS_SAFETY.retentionDays} days.{" "}
        <a
          href={CAMPUS_SAFETY.url}
          className="font-medium text-brand underline underline-offset-2"
        >
          Details
        </a>
      </p>
    </main>
  );
}
