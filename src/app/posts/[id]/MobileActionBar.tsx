"use client";

import { useActionState, useEffect, useState } from "react";

import { Icon, XGlyph } from "@/components/icons";
import { Button, buttonClass, Textarea } from "@/components/ui";
import { startConversation } from "@/app/messages/actions";
import { submitClaim, type ActionState } from "./actions";

const initialState: ActionState = {};

/**
 * The phone's answer to the desktop sidebar: whatever a visitor can do with this
 * post, pinned to the bottom of the screen where a thumb already is.
 *
 * One primary action at most. On the desktop sidebar "This is mine" and
 * "Message" sat as two equal full-width buttons; here the second one is visibly
 * secondary, so it's obvious which is the expected path.
 */
export function MobileActionBar({
  postId,
  authorName,
  mode,
  note,
  collectUrl,
}: {
  postId: string;
  authorName: string;
  /** claim: can claim · message: message only · collect: handed in to Campus Safety */
  mode: "claim" | "message" | "collect";
  /** A one-line status above the buttons, e.g. where your claim stands. */
  note?: string;
  collectUrl?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Beside a primary button there's only room for one word; on its own it can
  // say who you're messaging.
  const message = (primary: boolean) => (
    <form action={startConversation} className={primary ? "flex-1" : "shrink-0"}>
      <input type="hidden" name="postId" value={postId} />
      <Button type="submit" variant={primary ? "primary" : "secondary"} size="lg" className="w-full">
        {primary ? `Message ${authorName}` : "Message"}
      </Button>
    </form>
  );

  return (
    <>
      <div
        data-mobile-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
      >
        {note && <p className="mb-2.5 text-center text-sm text-muted">{note}</p>}
        <div className="flex gap-2">
          {mode === "claim" && (
            <>
              <Button size="lg" className="flex-1" onClick={() => setSheetOpen(true)}>
                This is mine
              </Button>
              {message(false)}
            </>
          )}
          {mode === "message" && message(true)}
          {mode === "collect" && (
            <>
              <a
                href={collectUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonClass("primary", "lg", "flex-1")}
              >
                Hours &amp; contact
              </a>
              {message(false)}
            </>
          )}
        </div>
      </div>

      {sheetOpen && <ClaimSheet postId={postId} onClose={() => setSheetOpen(false)} />}
    </>
  );
}

function ClaimSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);

  // A sheet is a modal: Escape closes it, and the page behind shouldn't scroll.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end md:hidden" role="dialog" aria-modal aria-labelledby="claim-title">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative w-full rounded-t-2xl border-t border-line bg-raised px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised">
        <div className="flex items-start justify-between gap-4">
          <h2 id="claim-title" className="text-lg font-semibold text-ink">
            Prove it&rsquo;s yours
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-sunken"
          >
            <Icon className="h-5 w-5">
              <XGlyph />
            </Icon>
          </button>
        </div>

        {state.ok ? (
          <>
            <p className="mt-3 rounded-control bg-success-subtle px-4 py-3 text-sm leading-relaxed text-success">
              Claim sent. The finder will check it against the item they&rsquo;re
              holding, and you&rsquo;ll be notified either way.
            </p>
            <Button size="lg" className="mt-4 w-full" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="postId" value={postId} />
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Describe something that isn&rsquo;t in the post — a marking, a name,
              what&rsquo;s inside. Something only the owner would know.
            </p>
            <label htmlFor="mobile-answer" className="sr-only">
              Identifying detail
            </label>
            <Textarea
              id="mobile-answer"
              name="answer"
              rows={4}
              required
              maxLength={500}
              autoFocus
              placeholder="e.g. a chip on the bottom-left corner, my initials on the back"
              className="mt-3"
            />
            {state.error && (
              <p role="alert" className="mt-1.5 text-sm text-danger">
                {state.error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={pending} className="mt-4 w-full">
              {pending ? "Sending…" : "Send claim"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
