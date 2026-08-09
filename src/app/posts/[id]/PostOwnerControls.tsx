"use client";

import Link from "next/link";
import { useState } from "react";

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
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-900">Delete this post?</p>
        <p className="mt-1 text-sm leading-relaxed text-red-800">
          This removes the post, its photos, replies and any claims. It
          can&rsquo;t be undone. If the item turned up, mark it resolved instead
          — that keeps the record and counts towards items reunited.
        </p>
        <div className="mt-3 flex gap-2">
          <form action={removeOwnPost}>
            <input type="hidden" name="postId" value={postId} />
            <button
              type="submit"
              className="rounded-lg bg-red-700 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-red-800"
            >
              Yes, delete it
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-red-300 px-3.5 py-1.5 text-sm font-medium text-red-800 transition hover:bg-red-100"
          >
            Keep it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isOpen && (
        <Link
          href={`/posts/${postId}/edit`}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          Edit post
        </Link>
      )}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg px-3 py-2 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-red-700"
      >
        Delete
      </button>
    </div>
  );
}
