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

  return (
    <form ref={formRef} action={formAction} className="mt-4">
      <input type="hidden" name="conversationId" value={conversationId} />
      <label htmlFor="body" className="sr-only">
        Message
      </label>
      <Textarea
        id="body"
        name="body"
        rows={3}
        required
        maxLength={2000}
        placeholder="Write a message…"
      />
      {state.error && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
