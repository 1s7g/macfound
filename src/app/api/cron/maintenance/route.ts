import { NextResponse } from "next/server";

import { describeError, sendAlert } from "@/lib/alerts";
import { runMaintenance } from "@/lib/maintenance";

/**
 * Nightly housekeeping: expire old posts, drop their photos, sweep orphaned
 * blobs. Triggered by the Vercel cron declared in vercel.json.
 *
 * Vercel attaches `Authorization: Bearer $CRON_SECRET` to scheduled requests
 * when that variable is set, which is the only thing separating this from a
 * public endpoint anyone could hammer to force deletions. In production a
 * missing secret is treated as a misconfiguration and refused outright rather
 * than left open — the same stance lib/email.ts takes about a missing mail key.
 * Locally it runs without one so the job is testable with a plain curl.
 */

// Deletions must never be served from a cache.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !secret) {
    console.error("CRON_SECRET is not set; refusing to run maintenance.");
    await sendAlert("Nightly maintenance is not configured", "CRON_SECRET is missing, so posts aren't expiring and photos aren't being cleaned up.", "cron-config");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const report = await runMaintenance();
    console.log("Maintenance:", report);
    return NextResponse.json({ ok: true, ...report });
  } catch (error) {
    console.error("Maintenance run failed", error);
    await sendAlert("Nightly maintenance failed", describeError(error), "cron-failed");
    return NextResponse.json({ error: "Maintenance failed." }, { status: 500 });
  }
}
