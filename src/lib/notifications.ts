import { db } from "@/lib/db";
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
  return db.notification.create({
    data: { userId, type, payload: payload as unknown as Prisma.InputJsonValue },
  });
}

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
