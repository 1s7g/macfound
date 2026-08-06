import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 reads the datasource URL from here rather than schema.prisma.
 *
 * The URL is read defensively instead of via Prisma's env() helper, which
 * throws when the variable is missing. `prisma generate` only reads the schema
 * — it never opens a connection — but it runs during `npm install` on Vercel,
 * where environment variables aren't injected yet. env() turned that into a
 * hard build failure:
 *
 *   PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL
 *
 * With a placeholder fallback, code generation succeeds without a database,
 * and commands that genuinely need one (migrate, db push, studio) still fail
 * loudly — they just fail on connecting rather than on config parsing.
 */
const url =
  process.env.DATABASE_URL ?? "postgresql://unset:unset@localhost:5432/unset";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
});
