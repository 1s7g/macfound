"use client";

import { useActionState, useState } from "react";

import { submitClaim, type ActionState } from "./actions";

const initialState: ActionState = {};

export function ClaimForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return (
      <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        Claim sent. The finder will check it against the item they&rsquo;re
        holding and may ask a follow-up. You&rsquo;ll be notified either way.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        This is mine
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-stone-200 bg-white p-4">
      <input type="hidden" name="postId" value={postId} />

      <label htmlFor="answer" className="block text-sm font-medium text-stone-800">
        Prove it&rsquo;s yours
      </label>
      <p className="mt-1 mb-2.5 text-xs leading-relaxed text-stone-500">
        Describe something about this item that isn&rsquo;t in the post above —
        a marking, a name, what&rsquo;s inside, a scratch, where you think you
        left it. Anything the real owner would know and a stranger
        wouldn&rsquo;t. The finder has the item in front of them.
      </p>

      <textarea
        id="answer"
        name="answer"
        rows={3}
        required
        maxLength={500}
        autoFocus
        placeholder="e.g. there's a chip on the bottom left corner and my initials on the back"
        className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      {state.error && (
        <p role="alert" className="mt-1.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send claim"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-2 text-sm text-stone-500 transition hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
