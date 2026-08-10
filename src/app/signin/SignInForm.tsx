"use client";

import { useActionState } from "react";
import { requestSignInCode, type SignInState } from "./actions";

const initialState: SignInState = {};

export function SignInForm({ domain, next }: { domain: string; next: string }) {
  const [state, formAction, pending] = useActionState(requestSignInCode, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          McMaster email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          placeholder={`yourmacid@${domain}`}
          aria-describedby={state.error ? "email-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          className="w-full rounded-lg border border-line-strong bg-raised px-3.5 py-2.5 text-ink outline-none transition placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand/25"
        />
      </div>

      {state.error && (
        <p id="email-error" role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
      >
        {pending ? "Sending code…" : "Email me a sign-in code"}
      </button>

      <p className="text-center text-xs text-subtle">
        Only @{domain} addresses can create an account. That&rsquo;s what keeps
        listings trustworthy.
      </p>
    </form>
  );
}
