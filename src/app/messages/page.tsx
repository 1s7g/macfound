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
      <Header user={user} mobile={{ title: "Messages" }} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-5 md:py-6">
        <PageHeader title="Messages" desktopOnly />

        {conversations.length === 0 ? (
          <div className="md:mt-5">
            <EmptyState title="No conversations yet.">
              Open a post and tap <span className="font-medium text-ink">Message</span>{" "}
              to get in touch.
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y md:mt-5 divide-line overflow-hidden rounded-card border border-line bg-raised">
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
                      className={`mt-1.5 hidden h-2 w-2 shrink-0 rounded-full md:block ${
                        unread ? "bg-brand" : "bg-transparent"
                      }`}
                    />
                    {/* Phones: a face for each thread, like any messaging app. */}
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken text-[15px] font-semibold text-ink md:hidden"
                    >
                      {(conversation.other.name ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={`truncate text-[15px] md:text-sm ${unread ? "font-semibold text-ink md:font-medium" : "text-ink md:text-muted"}`}
                        >
                          {conversation.other.name ?? "A student"}
                          <span className="hidden md:inline"> · {conversation.post.title}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-subtle">
                          {formatDay(conversation.lastActivity)}
                          {unread && (
                            <span aria-hidden className="h-2 w-2 rounded-full bg-brand md:hidden" />
                          )}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted md:hidden">
                        {conversation.post.type === "FOUND" ? "Found" : "Lost"} ·{" "}
                        {conversation.post.title}
                      </span>
                      {conversation.lastMessage && (
                        <span
                          className={`mt-0.5 line-clamp-1 block text-sm ${unread ? "text-ink md:text-subtle" : "text-subtle"}`}
                        >
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
