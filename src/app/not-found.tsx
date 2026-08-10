import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Not found · MacFound" };

/**
 * 404.
 *
 * Reached both by genuinely bad URLs and by notFound() on a post that was
 * removed or has expired — so the copy names that second case rather than
 * assuming the visitor mistyped something. It also can't assume a session:
 * this renders for signed-out visitors too, so there's no Header here.
 */
export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-medium text-brand-text">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        This page doesn&rsquo;t exist
      </h1>
      <p className="mt-2 leading-relaxed text-muted">
        The link may be wrong, or the post may have been taken down or expired.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <ButtonLink href="/lost">Lost board</ButtonLink>
        <ButtonLink href="/found" variant="secondary">
          Found board
        </ButtonLink>
      </div>
    </main>
  );
}
