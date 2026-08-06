import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * Deployment health check.
 *
 * Reports whether required configuration is present and whether the database
 * is reachable. Deliberately reports booleans and coarse error names only —
 * never variable values, never a raw driver message — so it is safe to leave
 * publicly reachable. A misconfigured deploy is otherwise invisible until a
 * user hits an error, and "which env var did I forget" is the single most
 * common cause of a broken first deploy.
 */

export const dynamic = "force-dynamic";

const REQUIRED_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "ALLOWED_EMAIL_DOMAIN",
  "AUTH_RESEND_KEY",
  "EMAIL_FROM",
] as const;

export async function GET() {
  const config = Object.fromEntries(
    REQUIRED_VARS.map((name) => [name, Boolean(process.env[name])]),
  );

  let database: { reachable: boolean; error?: string } = { reachable: false };

  try {
    await db.$queryRaw`SELECT 1`;
    database = { reachable: true };
  } catch (error) {
    // Name/constructor only — a raw message can contain the connection string.
    database = {
      reachable: false,
      error: error instanceof Error ? error.name : "UnknownError",
    };
  }

  const healthy = Object.values(config).every(Boolean) && database.reachable;

  return NextResponse.json(
    { healthy, config, database, environment: process.env.VERCEL_ENV ?? "local" },
    { status: healthy ? 200 : 503 },
  );
}
