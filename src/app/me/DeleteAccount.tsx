"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui";
import { deleteAccount } from "./actions";

/**
 * Two steps on purpose: the first tap only explains what will happen. Deleting
 * an account can't be undone, and a single red button sitting next to Sign out
 * is one mis-tap away from losing everything.
 */
export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full px-4 py-3.5 text-left text-[15px] text-danger"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form action={deleteAccount} className="space-y-3 px-4 py-4">
      <p className="text-sm leading-relaxed text-ink">
        This permanently deletes your account, posts, photos, claims and messages.
        Conversations you&rsquo;re in will disappear for the other person too.
      </p>
      <div className="flex gap-2">
        <ConfirmButton />
        <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Deleting…" : "Delete everything"}
    </Button>
  );
}
