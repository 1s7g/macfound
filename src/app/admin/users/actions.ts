"use server";

import { revalidatePath } from "next/cache";

import { isModerator } from "@/lib/admin";
import { banEmail, unbanEmail } from "@/lib/bans";
import { requireUser } from "@/lib/session";

export type BanState = { ok?: string; error?: string };

/** Re-checks moderator status here rather than trusting that the page was gated. */
async function requireModerator() {
  const user = await requireUser("/admin/users");
  if (!isModerator(user.email)) throw new Error("Not allowed.");
  return user;
}

export async function banUser(_prev: BanState, formData: FormData): Promise<BanState> {
  const moderator = await requireModerator();
  const email = String(formData.get("email") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const deleteAccount = formData.get("deleteAccount") === "on";

  const result = await banEmail({ email, reason, bannedBy: moderator.email, deleteAccount });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/users");
  revalidatePath("/admin/stats");
  revalidatePath("/browse");
  return {
    ok: result.deletedAccount
      ? `Banned ${email.trim().toLowerCase()} and deleted their account and posts.`
      : `Banned ${email.trim().toLowerCase()}. They can't sign in.`,
  };
}

export async function unbanUser(formData: FormData): Promise<void> {
  await requireModerator();
  await unbanEmail(String(formData.get("email") ?? ""));
  revalidatePath("/admin/users");
}
