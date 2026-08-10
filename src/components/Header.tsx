import Link from "next/link";

import { BellGlyph, MessagesGlyph, NavGlyph, ReportsGlyph } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
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
            <MessagesGlyph />
          </NavIcon>
          <NavIcon href="/notifications" label="Notifications" count={unread}>
            <BellGlyph />
          </NavIcon>
          {moderator && (
            <NavIcon href="/admin/reports" label="Reports" count={openReports} danger>
              <ReportsGlyph />
            </NavIcon>
          )}
          <ThemeToggle />
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
      <NavGlyph>{children}</NavGlyph>
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
