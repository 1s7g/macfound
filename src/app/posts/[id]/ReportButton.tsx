"use client";

import { useActionState, useState } from "react";

import { FlagGlyph, Icon } from "@/components/icons";
import { Button, Textarea } from "@/components/ui";
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
      <p className="text-sm text-subtle">
        Thanks — reported. A moderator will take a look.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-subtle underline underline-offset-2 transition hover:text-ink"
      >
        <Icon className="h-4 w-4">
          <FlagGlyph />
        </Icon>
        Report this post
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-card border border-line bg-raised p-4">
      <input type="hidden" name="postId" value={postId} />

      <p className="text-sm font-medium text-ink">What&rsquo;s wrong with it?</p>

      <div className="mt-2.5 space-y-1.5">
        {REPORT_REASONS.map((reason, index) => (
          <label key={reason} className="flex items-start gap-2 text-sm text-ink">
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

      <label htmlFor="detail" className="mt-3 block text-sm font-medium text-ink">
        Anything else? (optional)
      </label>
      <Textarea id="detail" name="detail" rows={2} maxLength={500} className="mt-1 text-sm" />

      {state.error && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Sending…" : "Send report"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
