"use client";

import { useActionState, useEffect, useRef } from "react";

import { Icon, SendGlyph } from "@/components/icons";
import { Button, Textarea } from "@/components/ui";
import { addComment, type ActionState } from "./actions";

const initialState: ActionState = {};

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(addComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box after a successful post; otherwise the reply sits there
  // looking like it failed to send.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="mt-4">
      <input type="hidden" name="postId" value={postId} />
      <label htmlFor="body" className="sr-only">
        Write a reply
      </label>
      <Textarea
        id="body"
        name="body"
        rows={3}
        required
        maxLength={1000}
        placeholder="Seen this? Know whose it is? Say so here."
      />
      {state.error && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-2">
        <Icon className="h-4 w-4">
          <SendGlyph />
        </Icon>
        {pending ? "Posting…" : "Post reply"}
      </Button>
    </form>
  );
}
