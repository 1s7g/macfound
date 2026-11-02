"use server";

import { revalidatePath } from "next/cache";

import { deleteUserAndContent } from "@/lib/accounts";
import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Which notifications also arrive by email. Claims always do, so they aren't a setting. */
export async function updateEmailPrefs(formData: FormData): Promise<void> {
  const user = await requireUser("/me");
  await db.user.update({
    where: { id: user.id },
    data: {
      notifyOnMatch: formData.get("notifyOnMatch") === "on",
      notifyOnMessage: formData.get("notifyOnMessage") === "on",
    },
  });
  revalidatePath("/me");
}

/** Delete the signed-in account and everything attached to it — see lib/accounts. */
export async function deleteAccount(): Promise<void> {
  const user = await requireUser("/me");
  await deleteUserAndContent(user.id);
  // The session row went with the user; this clears the now-dangling cookie.
  await signOut({ redirectTo: "/?deleted=1" });
}
