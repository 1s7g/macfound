"use client";

import { useActionState } from "react";

import { Button, Field, Input } from "@/components/ui";
import { requestSignInCode, type SignInState } from "./actions";

const initialState: SignInState = {};

export function SignInForm({ domain, next }: { domain: string; next: string }) {
  const [state, formAction, pending] = useActionState(requestSignInCode, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <Field label="McMaster email" htmlFor="email" error={state.error}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          placeholder={`yourmacid@${domain}`}
          aria-invalid={state.error ? true : undefined}
          invalid={Boolean(state.error)}
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending code…" : "Email me a sign-in code"}
      </Button>

      <p className="text-center text-xs text-subtle">
        Only @{domain} addresses can sign in.
      </p>
    </form>
  );
}
