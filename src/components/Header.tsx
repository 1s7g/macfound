import Link from "next/link";

import { CountBadge } from "@/components/ui";
import { isModerator } from "@/lib/admin";
import { signOut } from "@/lib/auth";
import { unreadMessageCount } from "@/lib/messages";
import { unreadCount } from "@/lib/notifications";
import type { SessionUser } from "@/lib/session";

export async function Header({
  user,
  active,
}: {
  user: SessionUser;
  active?: "lost" | "found";
}) {
  const moderator = isModerator(user.email);
  const [unread, unreadMessages, openReports] = await Promise.all([
    unreadCount(user.id),
    unreadMessageCount(user.id),
    moderator ? openReportCountSafe() : Promise.resolve(0),
  ]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-1 px-4">
        <Link
          href="/lost"
          className="mr-2 shrink-0 text-[15px] font-semibold tracking-tight text-ink"
        >
          MacFound
        </Link>

        {/* Segmented control: the two boards are the app's primary axis, so they
            read as one switch rather than two unrelated links. */}
        <nav className="flex rounded-control bg-sunken p-0.5 text-sm">
          <NavPill href="/lost" current={active === "lost"}>
            Lost
          </NavPill>
          <NavPill href="/found" current={active === "found"}>
            Found
          </NavPill>
        </nav>

        <div className="ml-auto flex items-center">
          <IconLink href="/messages" label="Messages" count={unreadMessages} />
          <IconLink href="/notifications" label="Alerts" count={unread} />
          {moderator && (
            <IconLink href="/admin/reports" label="Reports" count={openReports} danger />
          )}

          <Link
            href="/me"
            title={user.email}
            className="ml-1 hidden max-w-28 truncate rounded-control px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-sunken hover:text-ink sm:block"
          >
            {user.name ?? user.email}
          </Link>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-control px-2.5 py-1.5 text-sm text-subtle transition-colors hover:bg-sunken hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

/** Only moderators pay for this query; keeps the import out of the hot path. */
async function openReportCountSafe(): Promise<number> {
  const { openReportCount } = await import("@/lib/reports");
  return openReportCount();
}

function NavPill({
  href,
  current,
  children,
}: {
  href: string;
  current?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={[
        "rounded-[calc(var(--radius-control)-0.15rem)] px-3 py-1 font-medium transition-colors",
        current
          ? "bg-raised text-ink shadow-card"
          : "text-muted hover:text-ink",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function IconLink({
  href,
  label,
  count,
  danger,
}: {
  href: string;
  label: string;
  count: number;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center rounded-control px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
    >
      {label}
      <CountBadge count={count} tone={danger ? "danger" : "brand"} />
    </Link>
  );
}
