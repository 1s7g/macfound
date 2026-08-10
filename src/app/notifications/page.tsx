import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import {
  asPayload,
  listNotifications,
  markAllRead,
  NOTIFICATION_LABELS,
} from "@/lib/notifications";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Notifications · MacFound" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const notifications = await listNotifications(user.id);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <Header user={user} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Notifications
          </h1>
          {unread > 0 && (
            <form
              action={async () => {
                "use server";
                const u = await requireUser("/notifications");
                await markAllRead(u.id);
                revalidatePath("/notifications");
              }}
            >
              <button
                type="submit"
                className="rounded-control px-2.5 py-1.5 text-sm text-subtle transition hover:bg-sunken hover:text-ink"
              >
                Mark all read
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="mt-6 rounded-card border border-dashed border-line-strong bg-raised p-8 text-center text-muted">
            Nothing yet. We&rsquo;ll tell you when someone replies, claims an
            item, or a possible match turns up.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {notifications.map((n) => {
              const payload = asPayload(n.payload);
              return (
                <li key={n.id}>
                  <Link
                    href={payload.href}
                    className={`block rounded-card border p-4 transition hover:border-line-strong ${
                      n.readAt
                        ? "border-line bg-raised"
                        : "border-brand-border bg-brand-subtle"
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      {!n.readAt && (
                        <span
                          aria-label="Unread"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                        />
                      )}
                      {NOTIFICATION_LABELS[n.type]}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-ink">
                      {payload.title}
                    </p>
                    {payload.body && (
                      <p className="mt-1 line-clamp-2 text-sm text-subtle">
                        {payload.actorName ? `${payload.actorName}: ` : ""}
                        {payload.body}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-subtle">
                      {formatDay(n.createdAt)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
