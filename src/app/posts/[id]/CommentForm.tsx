"use client";

import { useActionState, useEffect, useRef } from "react";

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
      <textarea
        id="body"
        name="body"
        rows={3}
        required
        maxLength={1000}
        placeholder="Seen this? Know whose it is? Say so here."
        className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {state.error && (
        <p role="alert" className="mt-1.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post reply"}
      </button>
    </form>
  );
}
