import { PostStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { POST_RETENTION_DAYS } from "@/lib/vocabulary";

/**
 * Scheduled housekeeping.
 *
 * Two jobs that the app promised but never did: posts displayed an expiry date
 * that nothing enforced, and every photo upload was permanent even when the
 * form was abandoned.
 *
 * Both are written to be safe to run repeatedly — the cron may retry, and a
 * second pass over an already-clean database must be a no-op rather than a
 * second round of deletions.
 */

/**
 * How long a blob may sit unreferenced before it counts as abandoned.
 *
 * Uploads happen the moment a photo is picked, but the URL is only attached to
 * a post when the form is submitted, so there is always a window where a
 * perfectly live blob has no row pointing at it. A day is far longer than
 * anyone spends filling in this form, and being wrong here means deleting a
 * photo out from under someone mid-post.
 */
const ORPHAN_GRACE_HOURS = 24;

export type MaintenanceReport = {
  expired: number;
  imagesDeleted: number;
  orphansDeleted: number;
  skipped?: string;
};

/**
 * Close out posts past their retention window.
 *
 * The feed already filters to OPEN, so flipping the status is all it takes for
 * them to disappear — no deletion, which keeps the post readable by anyone
 * holding a link and leaves the reunited/total counters intact.
 */
export async function expirePosts(now = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - POST_RETENTION_DAYS);

  const { count } = await db.post.updateMany({
    where: { status: PostStatus.OPEN, createdAt: { lt: cutoff } },
    data: { status: PostStatus.EXPIRED },
  });

  return count;
}

/**
 * Drop the photos attached to posts nobody can act on any more.
 *
 * Expired and removed posts stay readable, but their images are the expensive
 * part and no one is going to match against them — an expired post is by
 * definition one where that didn't happen. The rows go too, so the orphan sweep
 * below doesn't have to reason about which blobs are deliberately unreferenced.
 */
export async function deleteImagesForClosedPosts(): Promise<number> {
  const images = await db.postImage.findMany({
    where: { post: { status: { in: [PostStatus.EXPIRED, PostStatus.REMOVED] } } },
    select: { id: true, url: true },
  });

  if (images.length === 0) return 0;

  await deleteBlobs(images.map((image) => image.url));
  await db.postImage.deleteMany({ where: { id: { in: images.map((i) => i.id) } } });

  return images.length;
}

/**
 * Delete blobs that no post references.
 *
 * Picking a photo uploads it immediately, so abandoning the form — or removing
 * an image before submitting — leaves a file behind with nothing pointing at
 * it. Nothing else ever collected those.
 *
 * The referenced set is read once and compared in memory. That is fine at this
 * scale (a campus board, a few thousand photos at most) and much cheaper than a
 * query per blob; if the store ever outgrows it, the fix is to page through
 * blobs and query in batches.
 */
export async function deleteOrphanedBlobs(now = new Date()): Promise<number> {
  const referenced = new Set(
    (await db.postImage.findMany({ select: { url: true } })).map((i) => i.url),
  );

  const cutoff = new Date(now.getTime() - ORPHAN_GRACE_HOURS * 60 * 60 * 1000);
  const { list } = await import("@vercel/blob");

  const orphans: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (referenced.has(blob.url)) continue;
      if (blob.uploadedAt > cutoff) continue; // still inside the grace window
      orphans.push(blob.url);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  await deleteBlobs(orphans);
  return orphans.length;
}

/** Runs the whole sweep. Safe to call repeatedly. */
export async function runMaintenance(now = new Date()): Promise<MaintenanceReport> {
  const expired = await expirePosts(now);
  const imagesDeleted = await deleteImagesForClosedPosts();

  // Blob work needs a token; without one the post expiry above is still worth
  // doing, so report the skip rather than failing the whole run.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { expired, imagesDeleted: 0, orphansDeleted: 0, skipped: "blob storage not configured" };
  }

  const orphansDeleted = await deleteOrphanedBlobs(now);
  return { expired, imagesDeleted, orphansDeleted };
}

/**
 * Vercel Blob's delete is all-or-nothing per call, and one bad URL would take
 * the batch with it. Chunked so a large sweep doesn't hit request limits, and
 * failures are logged rather than thrown: a blob that resists deletion should
 * not stop posts from expiring.
 */
async function deleteBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const { del } = await import("@vercel/blob");
  const CHUNK = 100;

  for (let i = 0; i < urls.length; i += CHUNK) {
    const chunk = urls.slice(i, i + CHUNK);
    try {
      await del(chunk);
    } catch (error) {
      console.error(`Failed to delete ${chunk.length} blobs`, error);
    }
  }
}
