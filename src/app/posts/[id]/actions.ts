"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { isModerator } from "@/lib/admin";
import { runMatching } from "@/lib/matching";
import {
  createPostSchema,
  deletePost,
  updatePost,
} from "@/lib/posts";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { fileReport, hasReportedPost } from "@/lib/reports";
import { notifyUnlessSelf } from "@/lib/notifications";
import { consume } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { ClaimStatus, PostStatus, PostType } from "@/generated/prisma/enums";

export type ActionState = { error?: string; ok?: boolean };

const commentSchema = z
  .string()
  .trim()
  .min(2, "Say a little more than that.")
  .max(1000, "Keep replies under 1000 characters.");

const claimSchema = z
  .string()
  .trim()
  .min(10, "Describe the detail properly — a few words isn't enough to verify.")
  .max(500, "Keep it under 500 characters.");

export async function addComment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");

  const parsed = commentSchema.safeParse(formData.get("body"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const limit = await consume(`comment:${user.id}`, 20, 60 * 60);
  if (!limit.allowed) return { error: "You're commenting a lot. Try again shortly." };

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, title: true, status: true },
  });
  if (!post) return { error: "That post no longer exists." };
  if (post.status !== PostStatus.OPEN) {
    return { error: "This post is closed, so replies are turned off." };
  }

  await db.comment.create({
    data: { postId: post.id, authorId: user.id, body: parsed.data },
  });

  await notifyUnlessSelf(post.authorId, user.id, "NEW_COMMENT", {
    title: post.title,
    body: parsed.data.slice(0, 140),
    href: `/posts/${post.id}`,
    actorName: user.name ?? undefined,
  });

  revalidatePath(`/posts/${post.id}`);
  return { ok: true };
}

/**
 * Claim a found item.
 *
 * The claimant never sees the withheld detail — they describe what they believe
 * is on the item, and the finder compares. Verification is a human judgement,
 * not a string match, which is what makes it robust: a real owner phrases it
 * their own way, and a chancer guessing has nothing to go on.
 */
export async function submitClaim(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");

  const parsed = claimSchema.safeParse(formData.get("answer"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const limit = await consume(`claim:${user.id}`, 5, 60 * 60);
  if (!limit.allowed) {
    return { error: "You've made several claims recently. Try again later." };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, title: true, type: true, status: true },
  });
  if (!post) return { error: "That post no longer exists." };
  if (post.type !== PostType.FOUND) return { error: "Only found items can be claimed." };
  if (post.status !== PostStatus.OPEN) return { error: "This item has already been closed." };
  if (post.authorId === user.id) return { error: "You can't claim your own post." };

  try {
    await db.claim.create({
      data: { postId: post.id, claimantId: user.id, answer: parsed.data },
    });
  } catch {
    // Unique constraint on (postId, claimantId) — one claim per person per post.
    return { error: "You've already claimed this item. The finder is reviewing it." };
  }

  await notifyUnlessSelf(post.authorId, user.id, "CLAIM_SUBMITTED", {
    title: post.title,
    body: parsed.data.slice(0, 140),
    href: `/posts/${post.id}`,
    actorName: user.name ?? undefined,
  });

  revalidatePath(`/posts/${post.id}`);
  return { ok: true };
}

/** Finder approves or rejects a claim. Approving also closes the post. */
export async function decideClaim(formData: FormData): Promise<void> {
  const user = await requireUser();
  const claimId = String(formData.get("claimId") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";

  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      claimantId: true,
      status: true,
      post: { select: { id: true, authorId: true, title: true } },
    },
  });

  // Authorisation, not just UI gating: only the finder may decide, and only once.
  if (!claim || claim.post.authorId !== user.id || claim.status !== ClaimStatus.PENDING) {
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.claim.update({
      where: { id: claim.id },
      data: {
        status: approve ? ClaimStatus.APPROVED : ClaimStatus.REJECTED,
        decidedAt: new Date(),
      },
    });

    if (approve) {
      await tx.post.update({
        where: { id: claim.post.id },
        data: { status: PostStatus.RESOLVED, resolvedAt: new Date() },
      });
      // Any other pending claims are moot once the item has an owner.
      await tx.claim.updateMany({
        where: { postId: claim.post.id, status: ClaimStatus.PENDING },
        data: { status: ClaimStatus.REJECTED, decidedAt: new Date() },
      });
    }
  });

  await notifyUnlessSelf(
    claim.claimantId,
    user.id,
    approve ? "CLAIM_APPROVED" : "CLAIM_REJECTED",
    {
      title: claim.post.title,
      body: approve
        ? "The finder confirmed it's yours — message them to arrange pickup."
        : "The finder didn't think the details matched.",
      href: `/posts/${claim.post.id}`,
    },
  );

  revalidatePath(`/posts/${claim.post.id}`);
  revalidatePath("/found");
}

/** Author marks their own post resolved (or reopens it). */
export async function setPostResolved(formData: FormData): Promise<void> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const resolved = String(formData.get("resolved") ?? "") === "true";

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, type: true },
  });
  if (!post || post.authorId !== user.id) return;

  await db.post.update({
    where: { id: post.id },
    data: {
      status: resolved ? PostStatus.RESOLVED : PostStatus.OPEN,
      resolvedAt: resolved ? new Date() : null,
    },
  });

  revalidatePath(`/posts/${post.id}`);
  revalidatePath(post.type === PostType.FOUND ? "/found" : "/lost");
}

/**
 * Hide a match suggestion.
 *
 * Either side of a pair may dismiss it — a bad suggestion is noise for both
 * of them, and there's no reason to make the other person dismiss it again.
 */
export async function dismissMatch(formData: FormData): Promise<void> {
  const user = await requireUser();
  const matchId = String(formData.get("matchId") ?? "");
  const postId = String(formData.get("postId") ?? "");

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      source: { select: { id: true, authorId: true } },
      candidate: { select: { id: true, authorId: true } },
    },
  });

  if (!match) return;
  const involved =
    match.source.authorId === user.id || match.candidate.authorId === user.id;
  if (!involved) return;

  // Dismiss both directions of the pair. runMatching stores A->B and B->A as
  // separate rows, so hiding only the one that was clicked leaves its mirror
  // to resurface the same suggestion on the next render.
  await db.match.updateMany({
    where: {
      dismissedAt: null,
      OR: [
        { sourceId: match.source.id, candidateId: match.candidate.id },
        { sourceId: match.candidate.id, candidateId: match.source.id },
      ],
    },
    data: { dismissedAt: new Date() },
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/posts/${match.source.id}`);
  revalidatePath(`/posts/${match.candidate.id}`);
}

// --- Owning your own post --------------------------------------------------

export type EditState = {
  errors?: Partial<Record<string, string>>;
  formError?: string;
  values?: Record<string, string>;
};

export async function saveEdit(
  _prev: EditState,
  formData: FormData,
): Promise<EditState | never> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");

  const raw = {
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    location: String(formData.get("location") ?? ""),
    locationDetail: String(formData.get("locationDetail") ?? ""),
    occurredOn: String(formData.get("occurredOn") ?? ""),
  };

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      errors[field] ??= issue.message;
    }
    return { errors, values: raw };
  }

  const updated = await updatePost(postId, user.id, parsed.data);
  if (!updated) return { formError: "You can't edit that post." };

  // The words, category, place and date all feed the matcher, so an edit can
  // change who this should be matched against. Re-running is cheap and keeps
  // suggestions honest; a failure here must not lose the user's edit.
  try {
    await runMatching(updated.id);
  } catch (error) {
    console.error("Re-matching failed after edit", updated.id, error);
  }

  revalidatePath(`/posts/${updated.id}`);
  revalidatePath(updated.type === PostType.FOUND ? "/found" : "/lost");
  revalidatePath("/me");
  redirect(`/posts/${updated.id}`);
}

export async function removeOwnPost(formData: FormData): Promise<void> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");

  const deleted = await deletePost(postId, user.id);
  if (!deleted) return;

  revalidatePath(deleted.type === PostType.FOUND ? "/found" : "/lost");
  revalidatePath("/me");
  redirect(deleted.type === PostType.FOUND ? "/found" : "/lost");
}

// --- Reporting -------------------------------------------------------------

export async function reportPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const commentId = String(formData.get("commentId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "");

  if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) {
    return { error: "Pick a reason." };
  }

  const limit = await consume(`report:${user.id}`, 10, 60 * 60);
  if (!limit.allowed) return { error: "You've filed several reports. Try again later." };

  if (postId && (await hasReportedPost(user.id, postId))) {
    return { ok: true };
  }

  await fileReport({
    reporterId: user.id,
    postId: postId || undefined,
    commentId: commentId || undefined,
    reason: reason as (typeof REPORT_REASONS)[number],
    detail,
  });

  revalidatePath("/admin/reports");
  return { ok: true };
}

// --- Moderation ------------------------------------------------------------

/** Guarded by ADMIN_EMAILS, re-checked here rather than trusted from the page. */
export async function moderateReport(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!isModerator(user.email)) return;

  const reportId = String(formData.get("reportId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const action = String(formData.get("action") ?? "");

  const { removePost, resolveReport, resolveReportsForPost } = await import(
    "@/lib/reports"
  );

  if (action === "remove" && postId) {
    await removePost(postId);
    await resolveReportsForPost(postId);
    revalidatePath(`/posts/${postId}`);
    revalidatePath("/lost");
    revalidatePath("/found");
  } else {
    await resolveReport(reportId);
  }

  revalidatePath("/admin/reports");
}
