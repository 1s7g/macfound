import { db } from "@/lib/db";

/**
 * Delete an account and everything attached to it.
 *
 * Shared by "Delete my account" and the moderator's ban tool, so both remove
 * exactly the same things.
 *
 * Photos are removed from Blob first: they live outside the database, so the
 * cascade can't reach them, and a link to a deleted account's photo shouldn't
 * keep working. A failed blob delete is logged and the account goes anyway —
 * the nightly orphan sweep collects anything left behind.
 *
 * The schema cascades the rest from the User row: posts, claims, messages,
 * conversations, notifications, reports filed, and sessions.
 */
export async function deleteUserAndContent(userId: string): Promise<void> {
  const images = await db.postImage.findMany({
    where: { post: { authorId: userId } },
    select: { url: true },
  });
  if (images.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import("@vercel/blob");
      await del(images.map((image) => image.url));
    } catch (error) {
      console.error("Could not delete photos for account", userId, error);
    }
  }

  await db.user.delete({ where: { id: userId } });
}
