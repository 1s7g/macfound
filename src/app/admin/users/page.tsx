import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminNav } from "@/components/AdminNav";
import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { Badge, Button, Input, PageHeader } from "@/components/ui";
import { isModerator } from "@/lib/admin";
import { listBans, searchUsers } from "@/lib/bans";
import { requireUser } from "@/lib/session";
import { unbanUser } from "./actions";
import { BanForm } from "./BanForm";

export const metadata: Metadata = { title: "Users · MacFound" };

/**
 * Moderators only: find an account, ban it, and see who's banned.
 *
 * Unlike everywhere else in the app this shows full email addresses — a ban is
 * by email, and a moderator has to be sure which account they're acting on.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser("/admin/users");
  if (!isModerator(user.email)) notFound();

  const { q } = await searchParams;
  const [users, bans] = await Promise.all([searchUsers(q), listBans()]);
  const banned = new Set(bans.map((ban) => ban.email));

  return (
    <>
      <Header user={user} mobile={{ title: "Users", back: { href: "/me", label: "Profile" } }} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-5 md:py-6">
        <PageHeader title="Users" desktopOnly />
        <AdminNav current="/admin/users" />

        <section className="mt-6">
          <h2 className="mb-2.5 font-semibold text-ink">Ban an email address</h2>
          <div className="rounded-card border border-line bg-raised p-4">
            <p className="mb-3 text-sm leading-relaxed text-muted">
              They won&rsquo;t be able to get a sign-in code. Use this for someone
              who isn&rsquo;t in the list below, like an account you already deleted.
            </p>
            <BanForm />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-2.5 font-semibold text-ink">Accounts</h2>
          <form method="GET" className="mb-3 flex gap-2">
            <Input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name or email"
              aria-label="Search accounts"
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {users.length === 0 ? (
            <p className="text-sm text-muted">No accounts match &ldquo;{q}&rdquo;.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
              {users.map((account) => (
                <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink">{account.name ?? "—"}</p>
                    <p className="truncate text-sm text-muted">{account.email}</p>
                    <p className="text-xs text-subtle">
                      Joined {formatDay(account.createdAt)} · {account._count.posts}{" "}
                      {account._count.posts === 1 ? "post" : "posts"}
                    </p>
                  </div>
                  {isModerator(account.email) ? (
                    <Badge>Admin</Badge>
                  ) : banned.has(account.email.toLowerCase()) ? (
                    <Badge tone="danger">Banned</Badge>
                  ) : (
                    <div className="w-full sm:w-auto">
                      <BanForm email={account.email} compact />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-subtle">
            {q ? `Up to 25 matches.` : "The 25 newest accounts. Search to find anyone else."}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-2.5 font-semibold text-ink">Banned</h2>
          {bans.length === 0 ? (
            <p className="text-sm text-muted">No one is banned.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
              {bans.map((ban) => (
                <li key={ban.email} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] text-ink">{ban.email}</p>
                    <p className="truncate text-xs text-subtle">
                      {formatDay(ban.createdAt)}
                      {ban.reason ? ` · ${ban.reason}` : ""}
                    </p>
                  </div>
                  <form action={unbanUser}>
                    <input type="hidden" name="email" value={ban.email} />
                    <Button type="submit" variant="ghost" size="sm">
                      Unban
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
