import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { getConversation, markConversationRead } from "@/lib/messages";
import { markReadForHref } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { MessageComposer } from "./MessageComposer";

export const metadata: Metadata = { title: "Conversation · MacFound" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);

  // Returns null for non-participants, so this is the authorisation check too.
  const conversation = await getConversation(id, user.id);
  if (!conversation) notFound();

  await Promise.all([
    markConversationRead(id, user.id),
    markReadForHref(user.id, `/messages/${id}`),
  ]);

  const isFound = conversation.post.type === "FOUND";

  return (
    <>
      <Header
        user={user}
        mobile={{
          back: { href: "/messages", label: "Messages" },
          title: conversation.other.name ?? "A student",
          tabs: false,
        }}
      />

      <main id="main" className="mx-auto flex w-full max-w-2xl flex-col px-4 py-4 md:py-6">
        <Link
          href="/messages"
          className="hidden text-sm text-subtle transition hover:text-ink md:inline"
        >
          ← All messages
        </Link>

        <div className="border-b border-line pb-4 md:mt-3">
          <h1 className="hidden text-lg font-semibold tracking-tight text-ink md:block">
            {conversation.other.name ?? "A student"}
          </h1>
          <p className="text-sm text-subtle md:mt-0.5">
            About{" "}
            <Link
              href={`/posts/${conversation.post.id}`}
              className="font-medium text-brand-text underline underline-offset-2"
            >
              {conversation.post.title}
            </Link>{" "}
            ({isFound ? "found" : "lost"})
            {conversation.post.status === "RESOLVED" && " · reunited"}
          </p>
        </div>

        {/* On a phone the composer is pinned over the bottom of the page, so
            the safety tip goes up top where it will actually be seen. */}
        <p className="mt-3 rounded-control bg-sunken px-3 py-2 text-xs leading-relaxed text-muted md:hidden">
          Meet somewhere public. Don&rsquo;t share your address or send money.
        </p>

        {conversation.messages.length === 0 ? (
          <p className="mt-6 rounded-card border border-dashed border-line-strong bg-raised p-6 text-center text-sm leading-relaxed text-muted max-md:border-0 max-md:bg-transparent max-md:py-12">
            No messages yet. Say hello and arrange the handoff.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {conversation.messages.map((message) => {
              const mine = message.senderId === user.id;
              return (
                <li
                  key={message.id}
                  className={mine ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      mine
                        ? "rounded-br-sm bg-brand text-white"
                        : "rounded-bl-sm border border-line bg-raised text-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.body}
                    </p>
                    <p
                      className={`mt-1 text-[11px] ${
                        mine ? "text-white/70" : "text-subtle"
                      }`}
                    >
                      {message.createdAt.toLocaleTimeString("en-CA", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <MessageComposer conversationId={conversation.id} />

        <p className="mt-6 hidden border-t border-line pt-4 text-xs leading-relaxed text-subtle md:block">
          Meet somewhere public to hand an item over. Don&rsquo;t share your
          address or send money to anyone claiming to have your item.
        </p>
      </main>
    </>
  );
}
