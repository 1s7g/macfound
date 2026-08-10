import Link from "next/link";

import { isModerator } from "@/lib/admin";
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
      <div className="mx-auto flex h-12 w-full max-w-4xl items-center gap-2 px-4">
        <Link
          href="/lost"
          className="mr-1 text-[15px] font-semibold tracking-tight text-ink"
        >
          MacFound
        </Link>

        <nav className="flex rounded-control bg-sunken p-0.5 text-sm">
          <NavPill href="/lost" current={active === "lost"}>
            Lost
          </NavPill>
          <NavPill href="/found" current={active === "found"}>
            Found
          </NavPill>
        </nav>

        <div className="ml-auto flex items-center gap-0.5">
          <NavIcon href="/messages" label="Messages" count={unreadMessages}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </NavIcon>
          <NavIcon href="/notifications" label="Notifications" count={unread}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </NavIcon>
          {moderator && (
            <NavIcon href="/admin/reports" label="Reports" count={openReports} danger>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </NavIcon>
          )}
          <Link
            href="/me"
            title={user.name ?? user.email}
            className="ml-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-on-brand"
          >
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}

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

function NavIcon({
  href,
  label,
  count,
  danger,
  children,
}: {
  href: string;
  label: string;
  count: number;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label}${count > 0 ? ` (${count})` : ""}`}
      className="relative flex h-8 w-8 items-center justify-center rounded-control text-muted transition-colors hover:bg-sunken hover:text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
      >
        {children}
      </svg>
      {count > 0 && (
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white ${
            danger ? "bg-danger" : "bg-brand"
          }`}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
