import { db } from "@/lib/db";
import { PostStatus } from "@/generated/prisma/enums";
import type { ReportReason } from "@/generated/prisma/enums";

export { REPORT_REASON_LABELS, REPORT_REASONS } from "@/lib/report-reasons";

/**
 * User reports and the moderator queue.
 *
 * Reports are cheap to file and cheap to dismiss on purpose. The alternative —
 * making people email someone — means nothing ever gets reported, and a public
 * board carrying student photos needs a working takedown path.
 */


export async function fileReport(input: {
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason: ReportReason;
  detail?: string;
}) {
  return db.report.create({
    data: {
      reporterId: input.reporterId,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      reason: input.reason,
      detail: input.detail?.trim() || null,
    },
    select: { id: true },
  });
}

/** Has this person already reported this post? Keeps the queue free of repeats. */
export async function hasReportedPost(reporterId: string, postId: string) {
  const existing = await db.report.findFirst({
    where: { reporterId, postId, resolvedAt: null },
    select: { id: true },
  });
  return existing !== null;
}

export async function listOpenReports() {
  return db.report.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      reason: true,
      detail: true,
      createdAt: true,
      reporter: { select: { id: true, name: true, email: true } },
      post: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          type: true,
          author: { select: { name: true, email: true } },
          images: { select: { url: true }, take: 1 },
        },
      },
      comment: {
        select: {
          id: true,
          body: true,
          postId: true,
          author: { select: { name: true, email: true } },
        },
      },
    },
  });
}

export async function openReportCount(): Promise<number> {
  return db.report.count({ where: { resolvedAt: null } });
}

/** Take a post down. Keeps the row so the moderation trail survives. */
export async function removePost(postId: string) {
  await db.post.update({
    where: { id: postId },
    data: { status: PostStatus.REMOVED },
  });
}

export async function resolveReport(reportId: string) {
  await db.report.update({
    where: { id: reportId },
    data: { resolvedAt: new Date() },
  });
}

/** Resolve every open report against a post — one action, one decision. */
export async function resolveReportsForPost(postId: string) {
  await db.report.updateMany({
    where: { postId, resolvedAt: null },
    data: { resolvedAt: new Date() },
  });
}
