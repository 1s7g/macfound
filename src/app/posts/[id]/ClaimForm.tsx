"use client";

import { useActionState, useState } from "react";

import { Button, Textarea } from "@/components/ui";
import { submitClaim, type ActionState } from "./actions";

const initialState: ActionState = {};

export function ClaimForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return (
      <p className="rounded-control border border-line bg-success-subtle px-4 py-3 text-sm text-success">
        Claim sent. The finder will check it against the item they&rsquo;re
        holding. You&rsquo;ll be notified either way.
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        This is mine
      </Button>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="postId" value={postId} />

      <label htmlFor="answer" className="block text-sm font-medium text-ink">
        Prove it&rsquo;s yours
      </label>
      <p className="mt-1 mb-2 text-xs leading-relaxed text-subtle">
        Describe something that isn&rsquo;t in the post — a marking, a name,
        what&rsquo;s inside. Something only the owner would know.
      </p>

      <Textarea
        id="answer"
        name="answer"
        rows={3}
        required
        maxLength={500}
        autoFocus
        placeholder="e.g. chip on the bottom-left corner, my initials on the back"
      />

      {state.error && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Sending…" : "Send claim"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
