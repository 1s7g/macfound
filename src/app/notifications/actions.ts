"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { markAllRead, markRead } from "@/lib/notifications";
import { safeRedirect } from "@/lib/safe-redirect";
import { requireUser } from "@/lib/session";

/**
 * Open a notification: mark it read, then go where it points.
 *
 * A form rather than a plain link because following it changes state. A link
 * that marked things read on GET would also fire on prefetch, clearing
 * notifications the person never opened.
 */
export async function openNotification(formData: FormData): Promise<void> {
  const user = await requireUser("/notifications");
  const id = String(formData.get("id") ?? "");

  const href = await markRead(user.id, id);
  revalidatePath("/notifications");
  redirect(safeRedirect(href ?? undefined, "/notifications"));
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser("/notifications");
  await markAllRead(user.id);
  revalidatePath("/notifications");
}
