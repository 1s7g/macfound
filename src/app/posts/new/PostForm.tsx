"use client";

import { useActionState } from "react";

import { ImageUpload } from "@/components/ImageUpload";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CAMPUS_SAFETY } from "@/lib/campus-safety";
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
        htmlFor="title"
        error={state.errors?.title}
      >
        <Input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          autoFocus
          defaultValue={v.title}
          placeholder="Black Hydro Flask with stickers"
          invalid={Boolean(state.errors?.title)}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        error={state.errors?.description}
        hint="Colour, brand, size, anything distinctive."
      >
        <Textarea
          id="description"
          name="description"
          required
          rows={4}
          maxLength={2000}
          defaultValue={v.description}
          invalid={Boolean(state.errors?.description)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category" error={state.errors?.category}>
          {/*
            key forces a remount when the echoed value changes. React applies
            defaultValue only at mount, so without this a validation error on
            any other field silently clears the user's selection.
          */}
          <Select
            key={`category-${v.category ?? ""}`}
            id="category"
            name="category"
            required
            defaultValue={v.category ?? ""}
            invalid={Boolean(state.errors?.category)}
          >
            <option value="" disabled>
              Choose one…
            </option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={isFound ? "Date found" : "Date lost"}
          htmlFor="occurredOn"
          error={state.errors?.occurredOn}
        >
          <Input
            id="occurredOn"
            name="occurredOn"
            type="date"
            required
            max={today}
            defaultValue={v.occurredOn ?? today}
            invalid={Boolean(state.errors?.occurredOn)}
          />
        </Field>
      </div>

      <Field
        label={isFound ? "Where did you find it?" : "Where did you lose it?"}
        htmlFor="location"
        error={state.errors?.location}
        hint="Pick the closest building — nearby spots still match."
      >
        <Select
          key={`location-${v.location ?? ""}`}
          id="location"
          name="location"
          required
          defaultValue={v.location ?? ""}
          invalid={Boolean(state.errors?.location)}
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
        </Select>
      </Field>

      <Field
        label="Exactly where? (optional)"
        htmlFor="locationDetail"
        error={state.errors?.locationDetail}
      >
        <Input
          id="locationDetail"
          name="locationDetail"
          type="text"
          maxLength={160}
          defaultValue={v.locationDetail}
          placeholder="3rd floor, near the printers"
          invalid={Boolean(state.errors?.locationDetail)}
        />
      </Field>

      <ImageUpload disabled={pending} />

      {isFound && (
        <div className="rounded-card border border-line bg-sunken p-4">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="handedIn"
              defaultChecked={v.handedIn === "on"}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
            />
            <span>
              <span className="font-medium">
                I&rsquo;ve handed this in to {CAMPUS_SAFETY.name}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-subtle">
                Post it either way — the owner still gets matched, and we&rsquo;ll
                tell them to collect it from {CAMPUS_SAFETY.building} instead of
                messaging you.
              </span>
            </span>
          </label>
        </div>
      )}

      {isFound && nearestDropOffHint && (
        <p className="rounded-card border border-line bg-warning-subtle p-4 text-xs leading-relaxed text-warning">
          {nearestDropOffHint}
        </p>
      )}

      {state.formError && (
        <p role="alert" className="text-sm text-danger">
          {state.formError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Posting…" : isFound ? "Post found item" : "Post lost item"}
      </Button>
    </form>
  );
}
