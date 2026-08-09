import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { listConversations } from "@/lib/messages";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Messages · MacFound" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const conversations = await listConversations(user.id);

  return (
    <>
      <Header user={user} />

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Messages</h1>

        {conversations.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center leading-relaxed text-stone-600">
            No conversations yet. Open a post and use{" "}
            <span className="font-medium text-stone-800">Message</span> to get in
            touch about an item.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className={`block rounded-xl border p-4 transition hover:border-stone-300 ${
                    conversation.unread > 0
                      ? "border-brand/30 bg-brand/5"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium text-stone-900">
                      {conversation.other.name ?? "A student"}
                    </p>
                    <span className="shrink-0 text-xs text-stone-400">
                      {formatDay(conversation.lastActivity)}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-sm text-stone-500">
                    {conversation.post.type === "FOUND" ? "Found" : "Lost"} ·{" "}
                    {conversation.post.title}
                  </p>

                  {conversation.lastMessage && (
                    <p className="mt-1.5 line-clamp-1 text-sm text-stone-700">
                      {conversation.lastMessage.senderId === user.id && (
                        <span className="text-stone-400">You: </span>
                      )}
                      {conversation.lastMessage.body}
                    </p>
                  )}

                  {conversation.unread > 0 && (
                    <span className="mt-2 inline-block rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
                      {conversation.unread} new
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
