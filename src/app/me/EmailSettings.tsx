"use client";

import { updateEmailPrefs } from "./actions";

/**
 * Email preferences. Each switch saves the moment it's flipped — a separate
 * Save button for two checkboxes is one more thing to forget to press.
 */
export function EmailSettings({
  notifyOnMatch,
  notifyOnMessage,
}: {
  notifyOnMatch: boolean;
  notifyOnMessage: boolean;
}) {
  return (
    <form
      action={updateEmailPrefs}
      onChange={(event) => event.currentTarget.requestSubmit()}
      className="divide-y divide-line"
    >
      <Toggle name="notifyOnMatch" label="A possible match turns up" defaultChecked={notifyOnMatch} />
      <Toggle name="notifyOnMessage" label="Someone messages me" defaultChecked={notifyOnMessage} />
      <p className="px-4 py-3 text-xs leading-relaxed text-subtle">
        Claims on your items, and decisions on your claims, are always emailed.
      </p>
    </form>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5">
      <span className="text-[15px] text-ink">{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 shrink-0 accent-[var(--color-brand)]"
      />
    </label>
  );
}
