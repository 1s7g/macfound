"use client";

import { useActionState, useRef, useState } from "react";

import { CategoryIcon } from "@/components/icons";
import { ImageUpload } from "@/components/ImageUpload";
import { Button, DateInput, Field, Input, Select, Textarea } from "@/components/ui";
import { CAMPUS_SAFETY } from "@/lib/campus-safety";
import { CATEGORIES, CATEGORY_LABELS, LOCATION_GROUPS, LOCATION_LABELS } from "@/lib/vocabulary";
import type { Category } from "@/generated/prisma/enums";
import { submitPost, type PostFormState } from "./actions";

const initialState: PostFormState = {};

// Which step each field lives on, on a phone — so a server-side error sends the
// person back to the step that needs fixing rather than leaving it off-screen.
const STEP_ONE_FIELDS = ["title", "category", "occurredOn", "location", "locationDetail"];

/**
 * The new-post form.
 *
 * On desktop it's one form, top to bottom. On a phone the same fields split
 * into two short steps — what and where, then details and photos — so nobody
 * faces nine fields and a keyboard at once. It stays a single <form> either way:
 * the steps only change what's visible, and the order classes put desktop's
 * fields back in their original sequence.
 */
export function PostForm({
  type,
  today,
  yesterday,
}: {
  type: "LOST" | "FOUND";
  today: string;
  yesterday: string;
}) {
  const [state, formAction, pending] = useActionState(submitPost, initialState);
  const isFound = type === "FOUND";
  const v = state.values ?? {};

  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState(v.category ?? "");
  const [occurredOn, setOccurredOn] = useState(v.occurredOn ?? today);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const stepOneRef = useRef<HTMLDivElement>(null);

  // When a submission comes back rejected, jump to whichever step holds the
  // first error. Adjusted during render rather than in an effect, so the right
  // step is on screen in the same paint as the error.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.errors) {
      const fields = Object.keys(state.errors);
      setStep(fields.some((f) => STEP_ONE_FIELDS.includes(f)) ? 1 : 2);
    }
  }

  const next = () => {
    // Step two's fields are visible on submit, so the browser checks those; step
    // one's are about to be hidden, so check them now while they can be focused.
    const fields = stepOneRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "input, select",
    );
    for (const field of fields ?? []) {
      if (field.offsetParent !== null && !field.reportValidity()) return;
    }
    if (!category) {
      setCategoryError("Pick a category.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0 });
  };

  const categoryErrorText = categoryError ?? state.errors?.category;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="type" value={type} />

      {/* Two segments that fill in as you go — where you are, without reading. */}
      <div className="md:hidden">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-1 flex-1 rounded-full bg-brand" />
          <span className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-brand" : "bg-sunken"}`} />
        </div>
        <p className="mt-2 text-sm text-muted">
          {step === 1 ? "Step 1 of 2 · What and where" : "Step 2 of 2 · Details and photos"}
        </p>
      </div>

      {/* --- Step one: what and where ------------------------------------- */}
      <div
        ref={stepOneRef}
        className={`${step === 1 ? "flex" : "hidden"} flex-col gap-5 md:contents`}
      >
        <div className="md:order-1">
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
        </div>

        <div className="grid gap-5 md:order-3 md:grid-cols-2">
          <Field label="Category" htmlFor="category" error={categoryErrorText}>
            <Select
              id="category"
              name="category"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              invalid={Boolean(categoryErrorText)}
              className="hidden md:block"
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

            {/* Phones: tap a tile rather than open a picker for ten options. */}
            <div className="grid grid-cols-2 gap-2 md:hidden" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((value) => {
                const selected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setCategory(value);
                      setCategoryError(null);
                    }}
                    className={`flex min-h-12 items-center gap-2.5 rounded-control border px-3 py-2 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "border-brand bg-brand-subtle text-brand-text"
                        : "border-line-strong bg-raised text-ink"
                    }`}
                  >
                    <CategoryIcon category={value as Category} className="h-5 w-5" />
                    {CATEGORY_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label={isFound ? "Date found" : "Date lost"}
            htmlFor="occurredOn"
            error={state.errors?.occurredOn}
          >
            {/* The two answers most people give, one tap each. */}
            <div className="mb-2 flex gap-2 md:hidden">
              {[
                { label: "Today", value: today },
                { label: "Yesterday", value: yesterday },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setOccurredOn(option.value)}
                  aria-pressed={occurredOn === option.value}
                  className={`h-9 rounded-full border px-4 text-sm font-medium ${
                    occurredOn === option.value
                      ? "border-transparent bg-inverse text-ink-inverse"
                      : "border-line-strong bg-raised text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <DateInput
              id="occurredOn"
              name="occurredOn"
              required
              max={today}
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
              invalid={Boolean(state.errors?.occurredOn)}
            />
          </Field>
        </div>

        <div className="md:order-4">
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
        </div>

        <div className="md:order-5">
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
        </div>

        <Button type="button" size="lg" onClick={next} className="w-full md:hidden">
          Next
        </Button>
      </div>

      {/* --- Step two: details and photos --------------------------------- */}
      <div className={`${step === 2 ? "flex" : "hidden"} flex-col gap-5 md:contents`}>
        <div className="md:order-2">
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
        </div>

        <div className="md:order-6">
          <ImageUpload disabled={pending} />
        </div>

        {isFound && (
          <div className="rounded-card border border-line bg-sunken p-4 md:order-7">
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

        {state.formError && (
          <p role="alert" className="text-sm text-danger md:order-8">
            {state.formError}
          </p>
        )}

        <div className="flex gap-2 md:order-9">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setStep(1)}
            className="md:hidden"
          >
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="flex-1 md:h-10 md:flex-none md:px-4 md:text-sm"
          >
            {pending ? "Posting…" : isFound ? "Post found item" : "Post lost item"}
          </Button>
        </div>
      </div>
    </form>
  );
}
