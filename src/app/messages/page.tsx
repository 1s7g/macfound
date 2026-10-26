import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { EmptyState, PageHeader } from "@/components/ui";
import { listConversations } from "@/lib/messages";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Messages · MacFound" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const conversations = await listConversations(user.id);

  return (
    <>
      <Header user={user} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-5 md:py-6">
        <PageHeader title="Messages" />

        {conversations.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="No conversations yet.">
              Open a post and tap <span className="font-medium text-ink">Message</span>{" "}
              to get in touch.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
            {conversations.map((conversation) => {
              const unread = conversation.unread > 0;
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/messages/${conversation.id}`}
                    className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-sunken"
                  >
                    <span
                      aria-label={unread ? `${conversation.unread} unread` : undefined}
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        unread ? "bg-brand" : "bg-transparent"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={`truncate text-sm ${unread ? "font-medium text-ink" : "text-muted"}`}
                        >
                          {conversation.other.name ?? "A student"} ·{" "}
                          {conversation.post.title}
                        </span>
                        <span className="shrink-0 text-xs text-subtle">
                          {formatDay(conversation.lastActivity)}
                        </span>
                      </span>
                      {conversation.lastMessage && (
                        <span className="mt-0.5 line-clamp-1 block text-sm text-subtle">
                          {conversation.lastMessage.senderId === user.id && "You: "}
                          {conversation.lastMessage.body}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
