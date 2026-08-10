"use client";

import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui";
import { removeOwnPost } from "./actions";

/**
 * Edit and delete, for the post's author.
 *
 * Delete is behind an explicit confirm step rather than a native confirm()
 * dialog: deleting takes the photos with it and can't be undone, and browsers
 * are increasingly willing to suppress confirm() entirely.
 */
export function PostOwnerControls({
  postId,
  isOpen,
}: {
  postId: string;
  isOpen: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="rounded-card border border-line bg-danger-subtle p-4">
        <p className="text-sm font-medium text-danger">Delete this post?</p>
        <p className="mt-1 text-sm leading-relaxed text-danger">
          This removes the post, its photos, replies and claims — permanently.
          If the item turned up, mark it resolved instead.
        </p>
        <div className="mt-3 flex gap-2">
          <form action={removeOwnPost}>
            <input type="hidden" name="postId" value={postId} />
            <Button type="submit" variant="danger" size="sm">
              Yes, delete it
            </Button>
          </form>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            Keep it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isOpen && (
        <ButtonLink href={`/posts/${postId}/edit`} variant="secondary" size="sm">
          Edit post
        </ButtonLink>
      )}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-control px-2.5 py-1.5 text-sm text-subtle transition hover:bg-sunken hover:text-danger"
      >
        Delete
      </button>
    </div>
  );
}
