import Link from "next/link";
import { redirect } from "next/navigation";

import { CAMPUS_SAFETY } from "@/lib/campus-safety";
import { getStats } from "@/lib/posts";
import { getUser } from "@/lib/session";

export default async function Home() {
  // Signed-in students have no use for a marketing page.
  if (await getUser()) redirect("/lost");

  const stats = await getStats();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">MacFound</h1>
      <p className="mt-2 text-lg text-muted">Lost &amp; found for McMaster.</p>

      <p className="mt-6 leading-relaxed text-ink">
        Snapchat stories disappear in 24 hours. Post it here instead — it stays
        searchable, and when someone posts a matching item, you get told.
      </p>

      <Link
        href="/signin"
        className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-brand px-5 py-3 font-medium text-white transition hover:bg-brand-hover sm:w-auto sm:self-start"
      >
        Sign in with McMaster email
      </Link>

      {/* Only shown once there's something to show. An empty board advertising
          "0 items reunited" argues against itself. */}
      {stats.total > 0 && (
        <dl className="mt-10 flex gap-8 border-t border-line pt-6">
          <div>
            <dt className="text-xs uppercase tracking-wide text-subtle">Reunited</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-ink">
              {stats.reunited}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-subtle">Open right now</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-ink">{stats.open}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-subtle">Posted in total</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-ink">{stats.total}</dd>
          </div>
        </dl>
      )}

      <p className="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-subtle">
        Already handed in somewhere? McMaster&rsquo;s official lost &amp; found is{" "}
        {CAMPUS_SAFETY.name}, {CAMPUS_SAFETY.building} — they hold items for{" "}
        {CAMPUS_SAFETY.retentionDays} days.{" "}
        <a
          href={CAMPUS_SAFETY.url}
          className="font-medium text-brand-text underline underline-offset-2"
        >
          Details
        </a>
      </p>

      <p className="mt-6 text-xs text-subtle">
        A student project, not affiliated with or endorsed by McMaster University.
      </p>
    </main>
  );
}
