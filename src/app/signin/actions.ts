"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ALLOWED_EMAIL_DOMAIN, isAllowedEmail, normalizeEmail, signIn } from "@/lib/auth";
import {
  consume,
  POLICY,
  signInRequestIpKey,
  signInRequestKey,
} from "@/lib/rate-limit";

export type SignInState = { error?: string };

const schema = z.object({
  email: z.string().trim().min(1, "Enter your McMaster email.").pipe(z.email("That doesn't look like an email address.")),
});

async function clientIp(): Promise<string> {
  const h = await headers();
  // Vercel sets x-forwarded-for; take the first hop, which is the client.
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function requestSignInCode(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = normalizeEmail(parsed.data.email);

  if (!isAllowedEmail(email)) {
    return {
      error: `MacFound is only open to McMaster students — use your @${ALLOWED_EMAIL_DOMAIN} address.`,
    };
  }

  // Per-IP first: stops one host from walking through many addresses even
  // though each individual address is still under its own limit.
  const ipLimit = POLICY.signInRequestPerIp;
  const byIp = await consume(
    signInRequestIpKey(await clientIp()),
    ipLimit.limit,
    ipLimit.windowSeconds,
  );
  if (!byIp.allowed) {
    return { error: "Too many sign-in attempts from this network. Try again shortly." };
  }

  const emailLimit = POLICY.signInRequestPerEmail;
  const byEmail = await consume(
    signInRequestKey(email),
    emailLimit.limit,
    emailLimit.windowSeconds,
  );
  if (!byEmail.allowed) {
    const minutes = Math.ceil(byEmail.retryAfterSeconds / 60);
    return { error: `Too many codes requested. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  try {
    // Triggers the provider's sendVerificationRequest, which emails the code
    // (or prints it to the dev server terminal when no mail key is configured).
    await signIn("mcmaster", { email, redirect: false });
  } catch (error) {
    console.error("Failed to start sign-in for", email, error);
    return { error: "We couldn't send your code. Please try again." };
  }

  redirect(`/signin/code?email=${encodeURIComponent(email)}`);
}
