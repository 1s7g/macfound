import { NextResponse, type NextRequest } from "next/server";

import { handlers } from "@/lib/auth";
import { consume, POLICY, signInVerifyKey } from "@/lib/rate-limit";

/**
 * Auth.js route handlers, wrapped to rate-limit code verification.
 *
 * Auth.js verifies an emailed code inside its own callback route, so there is
 * no callback hook where a failed attempt can be counted. Wrapping the handler
 * is the seam: every GET to /api/auth/callback/mcmaster is an attempt to redeem
 * a code, and without a cap here a 6-digit code is brute-forceable.
 */

const VERIFY_PATH = "/api/auth/callback/mcmaster";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  if (url.pathname === VERIFY_PATH) {
    const email = url.searchParams.get("email");

    if (email) {
      const { limit, windowSeconds } = POLICY.signInVerifyPerEmail;
      const result = await consume(signInVerifyKey(email), limit, windowSeconds);

      if (!result.allowed) {
        // Redirect rather than 429 — this is a browser navigation, so the user
        // should land on a page that explains what happened.
        const tooMany = new URL("/signin/error?reason=too-many-attempts", url.origin);
        return NextResponse.redirect(tooMany, { status: 302 });
      }
    }
  }

  return handlers.GET(request);
}

export const POST = handlers.POST;
