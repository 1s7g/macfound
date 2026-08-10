"use client";

import { useActionState } from "react";

import { ImageUpload } from "@/components/ImageUpload";
import { CATEGORIES, CATEGORY_LABELS, LOCATION_GROUPS, LOCATION_LABELS } from "@/lib/vocabulary";
import { submitPost, type PostFormState } from "./actions";

const initialState: PostFormState = {};

export function PostForm({
  type,
  today,
  nearestDropOffHint,
}: {
  type: "LOST" | "FOUND";
  today: string;
  nearestDropOffHint?: string;
}) {
  const [state, formAction, pending] = useActionState(submitPost, initialState);
  const isFound = type === "FOUND";
  const v = state.values ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="type" value={type} />

      <Field
        label={isFound ? "What did you find?" : "What did you lose?"}
        name="title"
        error={state.errors?.title}
        hint="A short summary — 'Black Hydro Flask with stickers'"
      >
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          autoFocus
          defaultValue={v.title}
          className={inputClass(state.errors?.title)}
        />
      </Field>

      <Field
        label="Description"
        name="description"
        error={state.errors?.description}
        hint="Colour, brand, size, wear and tear, anything distinctive."
      >
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          maxLength={2000}
          defaultValue={v.description}
          className={inputClass(state.errors?.description)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" name="category" error={state.errors?.category}>
          {/*
            key forces a remount when the echoed value changes. React applies
            defaultValue only at mount, so without this a validation error on
            any other field silently clears the user's selection — and picking
            again from a 46-item location list is exactly the friction that
            makes people give up on a form.
          */}
          <select
            key={`category-${v.category ?? ""}`}
            id="category"
            name="category"
            required
            defaultValue={v.category ?? ""}
            className={inputClass(state.errors?.category)}
          >
            <option value="" disabled>
              Choose one…
            </option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={isFound ? "Date found" : "Date lost"}
          name="occurredOn"
          error={state.errors?.occurredOn}
        >
          <input
            id="occurredOn"
            name="occurredOn"
            type="date"
            required
            max={today}
            defaultValue={v.occurredOn ?? today}
            className={inputClass(state.errors?.occurredOn)}
          />
        </Field>
      </div>

      <Field
        label={isFound ? "Where did you find it?" : "Where did you lose it?"}
        name="location"
        error={state.errors?.location}
        hint="Pick the closest building — nearby spots still match."
      >
        <select
          key={`location-${v.location ?? ""}`}
          id="location"
          name="location"
          required
          defaultValue={v.location ?? ""}
          className={inputClass(state.errors?.location)}
        >
          <option value="" disabled>
            Choose a place…
          </option>
          {LOCATION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.locations.map((value) => (
                <option key={value} value={value}>
                  {LOCATION_LABELS[value]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <Field
        label="Exactly where? (optional)"
        name="locationDetail"
        error={state.errors?.locationDetail}
        hint="e.g. '3rd floor, near the printers'"
      >
        <input
          id="locationDetail"
          name="locationDetail"
          type="text"
          maxLength={160}
          defaultValue={v.locationDetail}
          className={inputClass(state.errors?.locationDetail)}
        />
      </Field>

      <ImageUpload disabled={pending} />

      {isFound && nearestDropOffHint && (
        <p className="rounded-xl border border-line bg-warning-subtle p-4 text-xs leading-relaxed text-warning">
          {nearestDropOffHint}
        </p>
      )}

      {state.formError && (
        <p role="alert" className="text-sm text-danger">
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Posting…" : isFound ? "Post found item" : "Post lost item"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs leading-relaxed text-subtle">{hint}</p>
      )}
    </div>
  );
}

function inputClass(error?: string): string {
  return [
    "w-full rounded-lg border bg-raised px-3.5 py-2.5 text-ink outline-none transition",
    "placeholder:text-subtle focus:ring-2",
    error
      ? "border-danger focus:border-danger"
      : "border-line-strong focus:border-brand focus:ring-brand/25",
  ].join(" ");
}
