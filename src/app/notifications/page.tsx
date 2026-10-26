import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { EmptyState, PageHeader } from "@/components/ui";
import { asPayload, listNotifications, NOTIFICATION_LABELS } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { markAllNotificationsRead, openNotification } from "./actions";

export const metadata: Metadata = { title: "Notifications · MacFound" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <Header user={user} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
        <PageHeader
          title="Notifications"
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
          <div className="mt-5">
            <EmptyState title="Nothing yet.">
              You&rsquo;ll hear about replies, claims and possible matches here.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
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
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.readAt ? "bg-transparent" : "bg-brand"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span
                            className={`truncate text-sm ${n.readAt ? "text-muted" : "font-medium text-ink"}`}
                          >
                            {NOTIFICATION_LABELS[n.type]} · {payload.title}
                          </span>
                          <span className="shrink-0 text-xs text-subtle">
                            {formatDay(n.createdAt)}
                          </span>
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
