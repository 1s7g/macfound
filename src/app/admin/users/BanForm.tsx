"use client";

import { useActionState, useState } from "react";

import { Button, Input } from "@/components/ui";
import { banUser, type BanState } from "./actions";

const initialState: BanState = {};

/**
 * Ban an address, either one typed in (someone already deleted, or who never
 * signed up) or one picked from the user list.
 *
 * From the list it's two steps on purpose: the first tap only opens the form,
 * so a mis-tap on a crowded phone screen can't ban the wrong student.
 * "Also delete their account" defaults on, because a troll's posts are usually
 * the reason for the ban.
 */
export function BanForm({ email, compact }: { email?: string; compact?: boolean }) {
  const [state, formAction, pending] = useActionState(banUser, initialState);
  const [open, setOpen] = useState(!compact);

  if (state.ok) {
    return <p className="text-sm text-success">{state.ok}</p>;
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Ban
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-2.5">
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Email address</span>
          <Input name="email" type="email" required placeholder="macid@mcmaster.ca" autoComplete="off" />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">
          Reason <span className="font-normal text-subtle">(optional, only you see it)</span>
        </span>
        <Input name="reason" maxLength={200} placeholder="Troll posts" autoComplete="off" />
      </label>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="deleteAccount"
          defaultChecked
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
        />
        Also delete their account and everything they posted
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Banning…" : "Ban"}
        </Button>
        {compact && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
