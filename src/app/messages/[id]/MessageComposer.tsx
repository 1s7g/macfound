"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button, Textarea } from "@/components/ui";
import { sendMessage, type MessageState } from "../actions";

const initialState: MessageState = {};

/** How often to check for the other person's replies. */
const POLL_MS = 10_000;

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, formAction, pending] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  // Poll rather than open a websocket. Two people arranging a handoff exchange
  // a handful of messages; a 10s refresh is indistinguishable from live at that
  // pace, and it costs no extra infrastructure. Worth revisiting only if
  // conversations ever get chatty.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [router]);

  // On a phone the composer is pinned to the bottom like any messaging app, with
  // the send button beside the box; on desktop it sits under the thread.
  return (
    <form
      ref={formRef}
      action={formAction}
      data-mobile-bar
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:static md:z-auto md:mt-4 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <label htmlFor="body" className="sr-only">
        Message
      </label>
      <div className="flex items-end gap-2 md:block">
        <Textarea
          id="body"
          name="body"
          rows={3}
          required
          maxLength={2000}
          placeholder="Write a message…"
          className="max-md:h-11 max-md:min-h-11 max-md:resize-none max-md:rounded-full max-md:py-2.5 max-md:[scrollbar-width:none]"
        />
        {state.error && (
          <p role="alert" className="mt-1.5 hidden text-sm text-danger md:block">
            {state.error}
          </p>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="max-md:h-11 max-md:rounded-full max-md:px-5 md:mt-2"
        >
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
      {/* Below the row on a phone; desktop shows it under the box, as before. */}
      {state.error && <p className="mt-1.5 text-sm text-danger md:hidden">{state.error}</p>}
    </form>
  );
}
