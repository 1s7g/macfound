import { db } from "@/lib/db";

/**
 * Direct messages, always anchored to a post.
 *
 * This is not a general chat app: a conversation exists to resolve one specific
 * item. Anchoring keeps intent obvious, keeps moderation scoped ("this thread
 * is about that post"), and means the unique constraint on (post, initiator)
 * can stop a dozen parallel threads about the same backpack.
 */

/** The other participant, from the viewer's perspective. */
export function otherParticipant<U>(
  conversation: { postAuthorId: string; postAuthor: U; initiator: U },
  viewerId: string,
): U {
  return conversation.postAuthorId === viewerId
    ? conversation.initiator
    : conversation.postAuthor;
}

/**
 * Open the thread between a viewer and a post's author, creating it if needed.
 *
 * Idempotent by design — "message them" from three different places must land
 * in the same thread, not create three.
 */
export async function openConversation(postId: string, viewerId: string) {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, title: true },
  });

  if (!post) return { error: "That post no longer exists." } as const;
  if (post.authorId === viewerId) {
    return { error: "That's your own post." } as const;
  }

  const conversation = await db.conversation.upsert({
    where: { postId_initiatorId: { postId: post.id, initiatorId: viewerId } },
    update: {},
    create: { postId: post.id, postAuthorId: post.authorId, initiatorId: viewerId },
    select: { id: true },
  });

  return { conversationId: conversation.id } as const;
}

/** Conversations the viewer is part of, most recently active first. */
export async function listConversations(viewerId: string) {
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ postAuthorId: viewerId }, { initiatorId: viewerId }],
      // A thread with no messages is just a button someone clicked.
      messages: { some: {} },
    },
    select: {
      id: true,
      postAuthorId: true,
      createdAt: true,
      post: { select: { id: true, title: true, type: true, status: true } },
      postAuthor: { select: { id: true, name: true } },
      initiator: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
      _count: {
        select: {
          messages: { where: { readAt: null, senderId: { not: viewerId } } },
        },
      },
    },
  });

  return conversations
    .map((conversation) => ({
      id: conversation.id,
      post: conversation.post,
      other: otherParticipant(conversation, viewerId),
      lastMessage: conversation.messages[0] ?? null,
      unread: conversation._count.messages,
      lastActivity: conversation.messages[0]?.createdAt ?? conversation.createdAt,
    }))
    // Sorting in memory: "most recent message" isn't a column, and the list is
    // small enough per user that a raw query would be premature.
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
}

/** A thread, or null if the viewer isn't a participant. */
export async function getConversation(conversationId: string, viewerId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      postAuthorId: true,
      initiatorId: true,
      post: {
        select: { id: true, title: true, type: true, status: true, authorId: true },
      },
      postAuthor: { select: { id: true, name: true, email: true } },
      initiator: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
      },
    },
  });

  if (!conversation) return null;

  // Authorisation lives here rather than in the page: every caller gets it.
  const isParticipant =
    conversation.postAuthorId === viewerId || conversation.initiatorId === viewerId;
  if (!isParticipant) return null;

  return { ...conversation, other: otherParticipant(conversation, viewerId) };
}

/** Mark the other side's messages as read. Safe to call on every thread view. */
export async function markConversationRead(conversationId: string, viewerId: string) {
  await db.message.updateMany({
    where: { conversationId, senderId: { not: viewerId }, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Total unread messages across all threads, for the header badge. */
export async function unreadMessageCount(viewerId: string): Promise<number> {
  return db.message.count({
    where: {
      readAt: null,
      senderId: { not: viewerId },
      conversation: {
        OR: [{ postAuthorId: viewerId }, { initiatorId: viewerId }],
      },
    },
  });
}
