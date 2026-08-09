import Link from "next/link";

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
  const [unread, unreadMessages] = await Promise.all([
    unreadCount(user.id),
    unreadMessageCount(user.id),
  ]);

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-3">
        <Link href="/lost" className="font-semibold tracking-tight text-stone-900">
          MacFound
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/lost" current={active === "lost"}>
            Lost
          </NavLink>
          <NavLink href="/found" current={active === "found"}>
            Found
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <Link
            href="/messages"
            className="relative rounded-md px-2 py-1 text-sm text-stone-600 transition hover:bg-stone-100"
          >
            Messages
            {unreadMessages > 0 && (
              <span
                aria-label={`${unreadMessages} unread messages`}
                className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-4 text-white"
              >
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
          <Link
            href="/notifications"
            className="relative rounded-md px-2 py-1 text-sm text-stone-600 transition hover:bg-stone-100"
          >
            Alerts
            {unread > 0 && (
              <span
                aria-label={`${unread} unread`}
                className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-4 text-white"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <span className="hidden text-sm text-stone-500 sm:inline" title={user.email}>
            {user.name ?? user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({
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
      className={
        current
          ? "rounded-md bg-brand px-3 py-1.5 font-medium text-white"
          : "rounded-md px-3 py-1.5 text-stone-600 transition hover:bg-stone-100"
      }
    >
      {children}
    </Link>
  );
}
