import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import {
  BellGlyph,
  CheckGlyph,
  Icon,
  MessagesGlyph,
  SearchGlyph,
  XGlyph,
} from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/ui";
import { asPayload, listNotifications, NOTIFICATION_LABELS } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { markAllNotificationsRead, openNotification } from "./actions";

const NOTIFICATION_GLYPHS = {
  MATCH_FOUND: <SearchGlyph />,
  NEW_COMMENT: <MessagesGlyph />,
  NEW_MESSAGE: <MessagesGlyph />,
  CLAIM_SUBMITTED: <BellGlyph />,
  CLAIM_APPROVED: <CheckGlyph />,
  CLAIM_REJECTED: <XGlyph />,
} as const;

export const metadata: Metadata = { title: "Notifications · MacFound" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <Header
        user={user}
        mobile={{
          title: "Notifications",
          action: unread > 0 && (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="h-10 px-1 text-sm font-medium text-brand-text">
                Mark all read
              </button>
            </form>
          ),
        }}
      />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-5 md:py-6">
        <PageHeader
          title="Notifications"
          desktopOnly
          action={
            unread > 0 && (
              <form action={markAllNotificationsRead}>
                <button
                  type="submit"
                  className="rounded-control px-2.5 py-1.5 text-sm text-subtle transition hover:bg-sunken hover:text-ink"
                >
                  Mark all read
                </button>
              </form>
            )
          }
        />

        {notifications.length === 0 ? (
          <div className="md:mt-5">
            <EmptyState title="Nothing yet.">
              You&rsquo;ll hear about replies, claims and possible matches here.
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y divide-line md:mt-5 overflow-hidden rounded-card border border-line bg-raised">
            {notifications.map((n) => {
              const payload = asPayload(n.payload);
              return (
                <li key={n.id}>
                  {/* Opening one marks it read; see openNotification. */}
                  <form action={openNotification}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sunken"
                    >
                      <span
                        aria-label={n.readAt ? undefined : "Unread"}
                        className={`mt-1.5 hidden h-2 w-2 shrink-0 rounded-full md:block ${
                          n.readAt ? "bg-transparent" : "bg-brand"
                        }`}
                      />
                      {/* Phones: what kind of news this is, before reading it. */}
                      <span
                        aria-hidden
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:hidden ${
                          n.readAt ? "bg-sunken text-muted" : "bg-brand-subtle text-brand-text"
                        }`}
                      >
                        <Icon className="h-5 w-5">{NOTIFICATION_GLYPHS[n.type]}</Icon>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span
                            className={`truncate text-[15px] md:text-sm ${n.readAt ? "text-ink md:text-muted" : "font-semibold text-ink md:font-medium"}`}
                          >
                            {NOTIFICATION_LABELS[n.type]}
                            <span className="hidden md:inline"> · {payload.title}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-xs text-subtle">
                            {formatDay(n.createdAt)}
                            {!n.readAt && (
                              <span aria-hidden className="h-2 w-2 rounded-full bg-brand md:hidden" />
                            )}
                          </span>
                        </span>
                        <span className="block truncate text-sm text-ink md:hidden">
                          {payload.title}
                        </span>
                        {payload.body && (
                          <span className="mt-0.5 line-clamp-2 block text-sm text-subtle">
                            {payload.actorName ? `${payload.actorName}: ` : ""}
                            {payload.body}
                          </span>
                        )}
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
