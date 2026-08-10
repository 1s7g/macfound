"use client";

import { useActionState } from "react";
import Link from "next/link";

import { CATEGORIES, CATEGORY_LABELS, LOCATION_GROUPS, LOCATION_LABELS } from "@/lib/vocabulary";
import { saveEdit, type EditState } from "../actions";

const initialState: EditState = {};

export function EditForm({
  post,
  today,
}: {
  post: {
    id: string;
    type: "LOST" | "FOUND";
    title: string;
    description: string;
    category: string;
    location: string;
    locationDetail: string | null;
    occurredOn: string;
  };
  today: string;
}) {
  const [state, formAction, pending] = useActionState(saveEdit, initialState);
  const v = state.values ?? {};
  const isFound = post.type === "FOUND";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="postId" value={post.id} />
      <input type="hidden" name="type" value={post.type} />

      <Field label={isFound ? "What did you find?" : "What did you lose?"} name="title" error={state.errors?.title}>
        <input
          id="title" name="title" type="text" required maxLength={120}
          defaultValue={v.title ?? post.title}
          className={inputClass(state.errors?.title)}
        />
      </Field>

      <Field label="Description" name="description" error={state.errors?.description}>
        <textarea
          id="description" name="description" required rows={4} maxLength={2000}
          defaultValue={v.description ?? post.description}
          className={inputClass(state.errors?.description)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" name="category" error={state.errors?.category}>
          <select
            key={`category-${v.category ?? post.category}`}
            id="category" name="category" required
            defaultValue={v.category ?? post.category}
            className={inputClass(state.errors?.category)}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>
            ))}
          </select>
        </Field>

        <Field label={isFound ? "Date found" : "Date lost"} name="occurredOn" error={state.errors?.occurredOn}>
          <input
            id="occurredOn" name="occurredOn" type="date" required max={today}
            defaultValue={v.occurredOn ?? post.occurredOn}
            className={inputClass(state.errors?.occurredOn)}
          />
        </Field>
      </div>

      <Field label={isFound ? "Where did you find it?" : "Where did you lose it?"} name="location" error={state.errors?.location}>
        <select
          key={`location-${v.location ?? post.location}`}
          id="location" name="location" required
          defaultValue={v.location ?? post.location}
          className={inputClass(state.errors?.location)}
        >
          {LOCATION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.locations.map((value) => (
                <option key={value} value={value}>{LOCATION_LABELS[value]}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <Field label="Exactly where? (optional)" name="locationDetail" error={state.errors?.locationDetail}>
        <input
          id="locationDetail" name="locationDetail" type="text" maxLength={160}
          defaultValue={v.locationDetail ?? post.locationDetail ?? ""}
          className={inputClass(state.errors?.locationDetail)}
        />
      </Field>

      {state.formError && (
        <p role="alert" className="text-sm text-danger">{state.formError}</p>
      )}

      <p className="text-xs text-subtle">
        Photos can&rsquo;t be changed after posting yet. Delete and repost if you
        need different ones.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit" disabled={pending}
          className="rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href={`/posts/${post.id}`} className="text-sm text-subtle transition hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label, name, error, children,
}: {
  label: string; name: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {error && <p role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

function inputClass(error?: string): string {
  return [
    "w-full rounded-lg border bg-raised px-3.5 py-2.5 text-ink outline-none transition focus:ring-2",
    error
      ? "border-danger focus:border-danger"
      : "border-line-strong focus:border-brand focus:ring-brand/25",
  ].join(" ");
}
