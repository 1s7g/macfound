import { NextResponse } from "next/server";

import { sendAlert } from "@/lib/alerts";
import { consume } from "@/lib/rate-limit";
import { getUser } from "@/lib/session";

/**
 * Where the photo picker reports a failed upload.
 *
 * Most of a photo upload happens in the student's browser: it shrinks the
 * picture, asks /api/upload for a token, then sends the file straight to Blob
 * storage. When the browser half fails — an in-app browser that can't read the
 * file, a format the phone hands over oddly — the server never sees it. This
 * route turns that into an alert with enough to diagnose it.
 *
 * Signed-in users only, and a handful per hour, so it can't be used to spam
 * the maintainer's inbox.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const limit = await consume(`upload-report:${user.id}`, 5, 60 * 60);
  if (!limit.allowed) return NextResponse.json({ ok: true });

  let body: { message?: unknown; fileType?: unknown; fileSize?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // An empty or broken body still says "an upload failed".
  }

  const text = (value: unknown, max: number) => String(value ?? "").slice(0, max);
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  await sendAlert(
    "Photo uploads are failing (browser)",
    [
      `Error: ${text(body.message, 300) || "(no message)"}`,
      `File: ${text(body.fileType, 40) || "(no type)"}, ${text(body.fileSize, 20) || "?"} bytes`,
      `Browser: ${userAgent.slice(0, 300)}`,
    ].join("\n"),
    // One alert per distinct error message, so a second kind of failure isn't
    // hidden behind the first one's half-hour quiet period.
    `upload-client:${text(body.message, 60)}`,
  );

  return NextResponse.json({ ok: true });
}
