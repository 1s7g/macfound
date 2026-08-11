"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CAMPUS_SAFETY } from "@/lib/campus-safety";
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
    handedInAt: Date | null;
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

      <Field label={isFound ? "What did you find?" : "What did you lose?"} htmlFor="title" error={state.errors?.title}>
        <Input
          id="title" name="title" type="text" required maxLength={120}
          defaultValue={v.title ?? post.title}
          invalid={Boolean(state.errors?.title)}
        />
      </Field>

      <Field label="Description" htmlFor="description" error={state.errors?.description}>
        <Textarea
          id="description" name="description" required rows={4} maxLength={2000}
          defaultValue={v.description ?? post.description}
          invalid={Boolean(state.errors?.description)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category" error={state.errors?.category}>
          <Select
            key={`category-${v.category ?? post.category}`}
            id="category" name="category" required
            defaultValue={v.category ?? post.category}
            invalid={Boolean(state.errors?.category)}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>
            ))}
          </Select>
        </Field>

        <Field label={isFound ? "Date found" : "Date lost"} htmlFor="occurredOn" error={state.errors?.occurredOn}>
          <Input
            id="occurredOn" name="occurredOn" type="date" required max={today}
            defaultValue={v.occurredOn ?? post.occurredOn}
            invalid={Boolean(state.errors?.occurredOn)}
          />
        </Field>
      </div>

      <Field label={isFound ? "Where did you find it?" : "Where did you lose it?"} htmlFor="location" error={state.errors?.location}>
        <Select
          key={`location-${v.location ?? post.location}`}
          id="location" name="location" required
          defaultValue={v.location ?? post.location}
          invalid={Boolean(state.errors?.location)}
        >
          {LOCATION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.locations.map((value) => (
                <option key={value} value={value}>{LOCATION_LABELS[value]}</option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      <Field label="Exactly where? (optional)" htmlFor="locationDetail" error={state.errors?.locationDetail}>
        <Input
          id="locationDetail" name="locationDetail" type="text" maxLength={160}
          defaultValue={v.locationDetail ?? post.locationDetail ?? ""}
          invalid={Boolean(state.errors?.locationDetail)}
        />
      </Field>

      {isFound && (
        <div className="rounded-card border border-line bg-sunken p-4">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="handedIn"
              defaultChecked={
                state.values ? state.values.handedIn === "on" : Boolean(post.handedInAt)
              }
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
            />
            <span>
              <span className="font-medium">
                I&rsquo;ve handed this in to {CAMPUS_SAFETY.name}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-subtle">
                Tick this once you drop it off and the post will tell the owner
                to collect it rather than message you.
              </span>
            </span>
          </label>
        </div>
      )}

      {state.formError && (
        <p role="alert" className="text-sm text-danger">{state.formError}</p>
      )}

      <p className="text-xs text-subtle">
        Photos can&rsquo;t be changed yet. Delete and repost to swap them.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Link href={`/posts/${post.id}`} className="text-sm text-subtle transition hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
