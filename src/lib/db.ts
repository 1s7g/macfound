import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client, constructed lazily on first use.
 *
 * The obvious version of this file builds the client at module scope:
 *
 *   export const db = new PrismaClient({ ... })
 *
 * That breaks the production build. Next.js imports every route module while
 * collecting page configuration, so a module-scope client turns "this route
 * exists" into "this route needs a working DATABASE_URL at build time" — and
 * the build failed on /api/auth/[...nextauth] with "DATABASE_URL is not set"
 * even though nothing was querying anything.
 *
 * Deferring construction to the first property access keeps the build free of
 * any database requirement while behaving identically at request time. Missing
 * configuration now surfaces when a request actually needs the database, with
 * a clear message, instead of taking down the whole build.
 *
 * The instance is cached on globalThis because Next.js hot-reloads modules in
 * development; without it, every save would open a new connection pool until
 * Postgres started refusing clients.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env locally, or to the project's " +
        "environment variables when deploying.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property);
    // Model delegates (db.user, db.post) are plain objects and pass through.
    // Methods ($queryRaw, $transaction) must stay bound to the real client.
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, property) {
    return Reflect.has(getClient(), property);
  },
});
