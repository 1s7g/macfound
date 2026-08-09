import Link from "next/link";
import { redirect } from "next/navigation";

import { CAMPUS_SAFETY } from "@/lib/campus-safety";
import { getUser } from "@/lib/session";

export default async function Home() {
  // Signed-in students have no use for a marketing page.
  if (await getUser()) redirect("/lost");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">MacFound</h1>
      <p className="mt-2 text-lg text-stone-600">Lost &amp; found for McMaster.</p>

      <p className="mt-6 leading-relaxed text-stone-700">
        Snapchat stories disappear in 24 hours. Post it here instead — it stays
        searchable, and when someone posts a matching item, you get told.
      </p>

      <Link
        href="/signin"
        className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-brand px-5 py-3 font-medium text-white transition hover:bg-brand-dark sm:w-auto sm:self-start"
      >
        Sign in with McMaster email
      </Link>

      <p className="mt-10 border-t border-stone-200 pt-6 text-sm leading-relaxed text-stone-500">
        Already handed in somewhere? McMaster&rsquo;s official lost &amp; found is{" "}
        {CAMPUS_SAFETY.name}, {CAMPUS_SAFETY.building} — they hold items for{" "}
        {CAMPUS_SAFETY.retentionDays} days.{" "}
        <a
          href={CAMPUS_SAFETY.url}
          className="font-medium text-brand underline underline-offset-2"
        >
          Details
        </a>
      </p>

      <p className="mt-6 text-xs text-stone-400">
        A student project, not affiliated with or endorsed by McMaster University.
      </p>
    </main>
  );
}
