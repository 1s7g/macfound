"use server";

import { revalidatePath } from "next/cache";

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
