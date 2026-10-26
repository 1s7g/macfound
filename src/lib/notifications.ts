import { after } from "next/server";

import { db } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { NotificationType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

/**
 * In-app notifications.
 *
 * The payload is denormalised deliberately (see the schema comment): rendering
 * the list is then a single indexed query with no joins, and a notification
 * keeps saying what it said at the time even if the post is later edited or
 * deleted. The cost is that payloads can go stale — acceptable, because a
 * notification is a record of a moment, not a live view.
 */

export type NotificationPayload = {
  title: string;
  body?: string;
  href: string;
  actorName?: string;
};

export async function notify(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
) {
  const notification = await db.notification.create({
    data: { userId, type, payload: payload as unknown as Prisma.InputJsonValue },
  });

  // The email goes out after the response, so a slow mail provider never holds
  // up the claim or message that caused it. Outside a request (the seed
  // script) there is no response to wait for, so it simply runs now.
  const send = () => maybeEmail(userId, notification.id, type, payload);
  try {
    after(send);
  } catch {
    await send();
  }

  return notification;
}

/**
 * Email the in-app notification too, when it's worth an inbox.
 *
 * In-app alone wasn't enough: someone who reports a lost item and closes the
 * tab never learns the matcher found it, which is the whole point of the app.
 *
 * - Claims always email — they're the step a handoff waits on.
 * - Matches and messages respect the person's settings on /me.
 * - A conversation emails only for the first unread message: a quick
 *   back-and-forth shouldn't become ten emails, and one is enough to bring
 *   someone back to read the rest.
 */
async function maybeEmail(
  userId: string,
  notificationId: string,
  type: NotificationType,
  payload: NotificationPayload,
): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, notifyOnMatch: true, notifyOnMessage: true },
    });
    if (!user) return;

    if (type === "MATCH_FOUND" && !user.notifyOnMatch) return;
    if (type === "NEW_MESSAGE") {
      if (!user.notifyOnMessage) return;
      const earlierUnread = await db.notification.count({
        where: {
          userId,
          type: "NEW_MESSAGE",
          readAt: null,
          id: { not: notificationId },
          payload: { path: ["href"], equals: payload.href },
        },
      });
      if (earlierUnread > 0) return;
    }
    if (type === "NEW_COMMENT") return; // public replies no longer exist

    const content = EMAIL_CONTENT[type](payload);
    await sendNotificationEmail({ to: user.email, ...content, action: { ...content.action, href: payload.href } });
  } catch (error) {
    console.error("Could not email notification", notificationId, error);
  }
}

const quoted = (p: NotificationPayload) => `“${p.title}”`;
const said = (p: NotificationPayload) =>
  p.body ? [`${p.actorName ? `${p.actorName}: ` : ""}${p.body}`] : [];

const EMAIL_CONTENT: Record<
  NotificationType,
  (p: NotificationPayload) => {
    subject: string;
    lines: string[];
    action: { label: string };
  }
> = {
  MATCH_FOUND: (p) => ({
    subject: `Possible match for ${quoted(p)}`,
    lines: [p.body ?? `A new post looks like it could be ${quoted(p)}.`, "Have a look and see if it's the same item."],
    action: { label: "See the match" },
  }),
  CLAIM_SUBMITTED: (p) => ({
    subject: `Someone claimed ${quoted(p)}`,
    lines: [`Someone says ${quoted(p)} is theirs and described it:`, ...said(p), "You're holding it, so you decide whether it matches."],
    action: { label: "Review the claim" },
  }),
  CLAIM_APPROVED: (p) => ({
    subject: `Your claim on ${quoted(p)} was approved`,
    lines: ["The finder confirmed it's yours.", "Message them to arrange the handoff — meet somewhere public."],
    action: { label: "Open the post" },
  }),
  CLAIM_REJECTED: (p) => ({
    subject: `Update on your claim for ${quoted(p)}`,
    lines: ["The finder didn't think the details matched.", "If you're sure it's yours, message them with more detail."],
    action: { label: "Open the post" },
  }),
  NEW_MESSAGE: (p) => ({
    subject: `New message about ${quoted(p)}`,
    lines: said(p),
    action: { label: "Reply" },
  }),
  NEW_COMMENT: (p) => ({
    subject: `New reply on ${quoted(p)}`,
    lines: said(p),
    action: { label: "Open the post" },
  }),
};

/**
 * Never notify someone about their own action — commenting on your own post
 * shouldn't ping you. Callers pass both ids and this quietly no-ops.
 */
export async function notifyUnlessSelf(
  userId: string,
  actorId: string,
  type: NotificationType,
  payload: NotificationPayload,
) {
  if (userId === actorId) return null;
  return notify(userId, type, payload);
}

export async function unreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, take = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
  });
}

/**
 * Mark one notification read and return where it points. Scoped to its owner,
 * so a guessed id belonging to someone else matches nothing.
 */
export async function markRead(userId: string, id: string): Promise<string | null> {
  const notification = await db.notification.findFirst({
    where: { id, userId },
    select: { payload: true, readAt: true },
  });
  if (!notification) return null;

  if (!notification.readAt) {
    await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
  return asPayload(notification.payload).href;
}

/**
 * Clear every notification that points at a page the person is now looking at.
 * Reading the thread or the post is reading the news about it, however you got
 * there — the bell shouldn't keep nagging about something already seen.
 */
export async function markReadForHref(userId: string, href: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, readAt: null, payload: { path: ["href"], equals: href } },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Human-readable label per type, used as the heading in the list. */
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  MATCH_FOUND: "Possible match",
  NEW_COMMENT: "New reply",
  NEW_MESSAGE: "New message",
  CLAIM_SUBMITTED: "Someone claimed your item",
  CLAIM_APPROVED: "Your claim was approved",
  CLAIM_REJECTED: "Your claim was declined",
};

export function asPayload(value: unknown): NotificationPayload {
  // Payloads are written by this module, but they round-trip through JSON
  // columns, so narrow defensively rather than trusting the DB shape.
  const p = (value ?? {}) as Partial<NotificationPayload>;
  return {
    title: typeof p.title === "string" ? p.title : "Notification",
    body: typeof p.body === "string" ? p.body : undefined,
    href: typeof p.href === "string" ? p.href : "/lost",
    actorName: typeof p.actorName === "string" ? p.actorName : undefined,
  };
}
