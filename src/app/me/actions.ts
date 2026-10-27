"use server";

import { revalidatePath } from "next/cache";

import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Which notifications also arrive by email. Claims always do, so they aren't a setting. */
export async function updateEmailPrefs(formData: FormData): Promise<void> {
  const user = await requireUser("/me");
  await db.user.update({
    where: { id: user.id },
    data: {
      notifyOnMatch: formData.get("notifyOnMatch") === "on",
      notifyOnMessage: formData.get("notifyOnMessage") === "on",
    },
  });
  revalidatePath("/me");
}

/**
 * Delete the signed-in account and everything attached to it.
 *
 * Photos are removed from Blob first: they live outside the database, so the
 * cascade below can't reach them, and a link to a deleted account's photo
 * shouldn't keep working. A failed blob delete is logged and the account goes
 * anyway — the nightly orphan sweep collects anything left behind.
 *
 * The schema cascades the rest from the User row: posts, claims, messages,
 * conversations, notifications, reports filed, and sessions.
 */
export async function deleteAccount(): Promise<void> {
  const user = await requireUser("/me");

  const images = await db.postImage.findMany({
    where: { post: { authorId: user.id } },
    select: { url: true },
  });
  if (images.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import("@vercel/blob");
      await del(images.map((image) => image.url));
    } catch (error) {
      console.error("Could not delete photos for account", user.id, error);
    }
  }

  await db.user.delete({ where: { id: user.id } });
  // The session row went with the user; this clears the now-dangling cookie.
  await signOut({ redirectTo: "/?deleted=1" });
}
