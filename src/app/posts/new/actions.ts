"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPost, createPostSchema } from "@/lib/posts";
import { consume } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";

export type PostFormState = {
  errors?: Partial<Record<string, string>>;
  formError?: string;
  /** Echoed back so a rejected submission doesn't wipe what the user typed. */
  values?: Record<string, string>;
};

/** Stops a single account flooding the board. Generous for real use. */
const POST_LIMIT = { limit: 10, windowSeconds: 60 * 60 };

export async function submitPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireUser();

  const raw = {
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    location: String(formData.get("location") ?? ""),
    locationDetail: String(formData.get("locationDetail") ?? ""),
    occurredOn: String(formData.get("occurredOn") ?? ""),
    secretDetail: String(formData.get("secretDetail") ?? ""),
  };

  const parsed = createPostSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      // Keep the first message per field; later ones are usually redundant.
      errors[field] ??= issue.message;
    }
    return { errors, values: raw };
  }

  const limit = await consume(
    `post:create:${user.id}`,
    POST_LIMIT.limit,
    POST_LIMIT.windowSeconds,
  );
  if (!limit.allowed) {
    return {
      formError: "You've posted a lot in the last hour. Try again shortly.",
      values: raw,
    };
  }

  let postId: string;
  try {
    const post = await createPost(user.id, parsed.data);
    postId = post.id;
  } catch (error) {
    console.error("Failed to create post for", user.id, error);
    return { formError: "Something went wrong saving your post. Please try again.", values: raw };
  }

  // Both feeds are cached route segments; the new post must appear immediately.
  revalidatePath("/lost");
  revalidatePath("/found");

  redirect(`/posts/${postId}?created=1`);
}
