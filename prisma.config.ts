import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 reads the datasource URL from here rather than schema.prisma.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
