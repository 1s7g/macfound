import { NextRequest, NextResponse } from "next/server";

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

/**
 * In development, point Auth.js at the address the browser actually used.
 *
 * Next's dev server reports every request URL as localhost:3000, and Auth.js
 * builds its post-sign-in redirect from that URL. A phone testing over Wi-Fi
 * (http://192.168.x.x:3000) was therefore sent to "localhost" after a correct
 * code — its own loopback, where nothing is running — and retrying spent the
 * single-use code. Production URLs are already correct, so this is dev-only.
 */
function withBrowserHost(request: NextRequest): NextRequest {
  if (process.env.NODE_ENV !== "development") return request;
  const host = request.headers.get("host");
  const url = new URL(request.url);
  if (!host || url.host === host) return request;
  url.host = host;
  return new NextRequest(url, request);
}

export async function GET(incoming: NextRequest) {
  const request = withBrowserHost(incoming);
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

export async function POST(request: NextRequest) {
  return handlers.POST(withBrowserHost(request));
}
