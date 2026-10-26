"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BellGlyph, Icon, MessagesGlyph, PlusGlyph, SearchGlyph, UserGlyph } from "@/components/icons";

type Tab = "browse" | "post" | "messages" | "alerts" | "me";

function activeTab(pathname: string): Tab | null {
  if (pathname.startsWith("/posts/new")) return "post";
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/notifications")) return "alerts";
  if (pathname.startsWith("/me") || pathname.startsWith("/admin")) return "me";
  if (/^\/(browse|lost|found|posts)/.test(pathname)) return "browse";
  return null;
}

/**
 * The phone's main navigation, at the bottom where thumbs reach.
 *
 * Labelled tabs rather than the desktop header's bare icons: on a phone there's
 * no hover to explain a speech bubble or a bell, and five words fit fine.
 * Posting gets the centre slot and the brand colour because it's the one thing
 * here that creates something.
 */
export function MobileTabBar({
  unreadMessages,
  unreadAlerts,
}: {
  unreadMessages: number;
  unreadAlerts: number;
}) {
  const current = activeTab(usePathname());

  return (
    <nav
      data-mobile-bar
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        <TabLink href="/browse" label="Browse" active={current === "browse"}>
          <SearchGlyph />
        </TabLink>
        <TabLink href="/messages" label="Messages" active={current === "messages"} count={unreadMessages}>
          <MessagesGlyph />
        </TabLink>
        <li className="flex items-center justify-center">
          <Link
            href="/posts/new"
            aria-label="Post an item"
            aria-current={current === "post" ? "page" : undefined}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-on-brand shadow-raised"
          >
            <Icon className="h-6 w-6">
              <PlusGlyph />
            </Icon>
          </Link>
        </li>
        <TabLink href="/notifications" label="Alerts" active={current === "alerts"} count={unreadAlerts}>
          <BellGlyph />
        </TabLink>
        <TabLink href="/me" label="Me" active={current === "me"}>
          <UserGlyph />
        </TabLink>
      </ul>
    </nav>
  );
}

function TabLink({
  href,
  label,
  active,
  count = 0,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={count > 0 ? `${label} (${count} unread)` : undefined}
        className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
          active ? "text-brand-text" : "text-muted"
        }`}
      >
        <span className="relative">
          <Icon className="h-6 w-6">{children}</Icon>
          {count > 0 && (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-on-brand">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </span>
        {label}
      </Link>
    </li>
  );
}
