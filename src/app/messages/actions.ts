"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { getConversation, openConversation } from "@/lib/messages";
import { notifyUnlessSelf } from "@/lib/notifications";
import { consume } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";

export type MessageState = { error?: string };

const bodySchema = z
  .string()
  .trim()
  .min(1, "Write something first.")
  .max(2000, "Keep messages under 2000 characters.");

/** "Message them" from a post — opens the thread, or reuses the existing one. */
export async function startConversation(formData: FormData): Promise<void> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");

  const result = await openConversation(postId, user.id);
  if ("error" in result) return;

  redirect(`/messages/${result.conversationId}`);
}

export async function sendMessage(
  _prev: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");

  const parsed = bodySchema.safeParse(formData.get("body"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const limit = await consume(`message:${user.id}`, 60, 60 * 60);
  if (!limit.allowed) {
    return { error: "You're sending a lot of messages. Try again shortly." };
  }

  // getConversation returns null for non-participants, so this is the
  // authorisation check as well as the lookup.
  const conversation = await getConversation(conversationId, user.id);
  if (!conversation) return { error: "That conversation isn't available." };

  await db.message.create({
    data: { conversationId, senderId: user.id, body: parsed.data },
  });

  await notifyUnlessSelf(conversation.other.id, user.id, "NEW_MESSAGE", {
    title: conversation.post.title,
    body: parsed.data.slice(0, 140),
    href: `/messages/${conversationId}`,
    actorName: user.name ?? undefined,
  });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return {};
}
