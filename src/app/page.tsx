import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui";
import { getStats } from "@/lib/posts";
import { getUser } from "@/lib/session";

export default async function Home() {
  if (await getUser()) redirect("/lost");

  const stats = await getStats();

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-5xl font-bold tracking-tight text-ink sm:text-6xl">
        MacFound
      </h1>
      <p className="mt-3 text-lg text-muted">
        Lost &amp; found for McMaster students.
      </p>

      <ButtonLink href="/signin" size="lg" className="mt-10 w-full sm:w-auto sm:self-start">
        Sign in with McMaster email
      </ButtonLink>

      {stats.total > 0 && (
        <dl className="mt-12 flex gap-8 border-t border-line pt-6">
          <Stat label="Reunited" value={stats.reunited} />
          <Stat label="Open" value={stats.open} />
          <Stat label="Total" value={stats.total} />
        </dl>
      )}

      <p className="mt-auto pt-12 text-xs text-subtle">
        A student project, not affiliated with McMaster University.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
