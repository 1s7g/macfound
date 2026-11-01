import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { PageHeader } from "@/components/ui";
import { isModerator } from "@/lib/admin";
import { requireUser } from "@/lib/session";
import { getStats, STATS_DAYS } from "@/lib/stats";
import { DailyBars } from "./DailyBars";

export const metadata: Metadata = { title: "Stats · MacFound" };

/**
 * Private numbers for whoever runs MacFound: who's signing up, whether they
 * post, and — the one that matters — whether items are getting back to people.
 * Moderators only, and a 404 for everyone else, like the reports queue.
 */
export default async function StatsPage() {
  const user = await requireUser("/admin/stats");
  if (!isModerator(user.email)) notFound();

  const stats = await getStats();
  const days = stats.daily.map((row) => row.day);

  return (
    <>
      <Header user={user} mobile={{ title: "Stats", back: { href: "/me", label: "Profile" } }} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-5 md:py-6">
        <PageHeader title="Stats" subtitle="Live from the database · days in Toronto time" desktopOnly />

        <dl className="grid grid-cols-2 gap-2.5 md:mt-5 md:grid-cols-4">
          <Tile
            label="Accounts"
            value={stats.accounts}
            note={`+${stats.accountsThisWeek} this week · +${stats.accountsToday} today`}
          />
          <Tile label="Signed in now" value={stats.signedIn} note="active sessions" />
          <Tile label="Posts" value={stats.posts} note={`${stats.lostPosts} lost · ${stats.foundPosts} found · ${stats.openPosts} open`} />
          <Tile
            label="Reunited"
            value={stats.reunited}
            note={`${stats.approvedClaims} of ${stats.claims} claims approved`}
            emphasis
          />
        </dl>
        <p className="mt-2 text-xs text-subtle">
          {stats.conversations} conversations · {stats.messages} messages
        </p>

        <div className="mt-6 space-y-4">
          <DailyBars
            title="New accounts per day"
            unit="sign-up"
            days={days}
            values={stats.daily.map((row) => row.accounts)}
          />
          <DailyBars
            title="New posts per day"
            unit="post"
            days={days}
            values={stats.daily.map((row) => row.posts)}
          />
          <DailyBars
            title="Items reunited per day"
            unit="reunion"
            days={days}
            values={stats.daily.map((row) => row.reunited)}
          />
        </div>

        <section className="mt-6">
          <h2 className="mb-2.5 font-semibold text-ink">Newest accounts</h2>
          {stats.recentAccounts.length === 0 ? (
            <p className="text-sm text-muted">No one has signed up yet.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
              {stats.recentAccounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]">
                  <span className="truncate text-ink">{account.name ?? "A student"}</span>
                  <span className="shrink-0 text-sm text-muted">{formatDay(account.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-subtle">
            Display names only. Charts cover the last {STATS_DAYS} days.
          </p>
        </section>
      </main>
    </>
  );
}

function Tile({
  label,
  value,
  note,
  emphasis,
}: {
  label: string;
  value: number;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-card border p-4 ${
        emphasis ? "border-brand-border bg-brand-subtle" : "border-line bg-raised"
      }`}
    >
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-ink">{value}</dd>
      <dd className="mt-1 text-xs leading-snug text-subtle">{note}</dd>
    </div>
  );
}
