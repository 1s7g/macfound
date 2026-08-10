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
        <h1 className="text-xl font-semibold tracking-tight text-ink">Messages</h1>

        {conversations.length === 0 ? (
          <p className="mt-6 rounded-card border border-dashed border-line-strong bg-raised p-8 text-center leading-relaxed text-muted">
            No conversations yet. Open a post and tap{" "}
            <span className="font-medium text-ink">Message</span> to get in touch.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className={`block rounded-card border p-4 transition hover:border-line-strong ${
                    conversation.unread > 0
                      ? "border-brand-border bg-brand-subtle"
                      : "border-line bg-raised"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium text-ink">
                      {conversation.other.name ?? "A student"}
                    </p>
                    <span className="shrink-0 text-xs text-subtle">
                      {formatDay(conversation.lastActivity)}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-sm text-subtle">
                    {conversation.post.type === "FOUND" ? "Found" : "Lost"} ·{" "}
                    {conversation.post.title}
                  </p>

                  {conversation.lastMessage && (
                    <p className="mt-1.5 line-clamp-1 text-sm text-ink">
                      {conversation.lastMessage.senderId === user.id && (
                        <span className="text-subtle">You: </span>
                      )}
                      {conversation.lastMessage.body}
                    </p>
                  )}

                  {conversation.unread > 0 && (
                    <span className="mt-2 inline-block rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-on-brand">
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
