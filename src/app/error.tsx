"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui";

/**
 * Route-level error boundary.
 *
 * Replaces the unstyled default that production showed when the database was
 * missing a migration: a black page reading "A server error occurred" with a
 * reference number and no way forward.
 *
 * `reset()` re-renders the segment without a full reload, which is enough for
 * anything transient (a dropped connection, a cold start). The digest is the
 * only handle on the real cause — Next.js strips server error messages in
 * production on purpose — so it's shown, quietly, for someone reading logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 leading-relaxed text-muted">
        This one&rsquo;s on us, not you. Trying again usually works.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/lost" variant="secondary">
          Back to the boards
        </ButtonLink>
      </div>

      {error.digest && (
        <p className="mt-8 border-t border-line pt-4 font-mono text-xs text-subtle">
          Reference: {error.digest}
        </p>
      )}
    </main>
  );
}
