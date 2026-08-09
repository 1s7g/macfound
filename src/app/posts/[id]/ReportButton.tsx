"use client";

import { useActionState, useState } from "react";

import { REPORT_REASON_LABELS, REPORT_REASONS } from "@/lib/report-reasons";
import { reportPost, type ActionState } from "./actions";

const initialState: ActionState = {};

/**
 * Report a post.
 *
 * Collapsed to a quiet link by default. Reporting should be easy to find when
 * you need it and easy to ignore when you don't — a prominent button invites
 * use as a disagree button.
 */
export function ReportButton({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(reportPost, initialState);
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return (
      <p className="text-sm text-stone-500">
        Thanks — reported. A moderator will take a look.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-stone-400 underline underline-offset-2 transition hover:text-stone-700"
      >
        Report this post
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-stone-200 bg-white p-4">
      <input type="hidden" name="postId" value={postId} />

      <p className="text-sm font-medium text-stone-800">What&rsquo;s wrong with it?</p>

      <div className="mt-2.5 space-y-1.5">
        {REPORT_REASONS.map((reason, index) => (
          <label key={reason} className="flex items-start gap-2 text-sm text-stone-700">
            <input
              type="radio"
              name="reason"
              value={reason}
              required
              defaultChecked={index === 0}
              className="mt-1 accent-[var(--color-brand)]"
            />
            {REPORT_REASON_LABELS[reason]}
          </label>
        ))}
      </div>

      <label htmlFor="detail" className="mt-3 block text-sm font-medium text-stone-800">
        Anything else? (optional)
      </label>
      <textarea
        id="detail"
        name="detail"
        rows={2}
        maxLength={500}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
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
          className="rounded-lg bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm text-stone-500 transition hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
