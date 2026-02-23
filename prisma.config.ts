import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env.local for config resolution
import { config } from "dotenv";
config({ path: ".env.local" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
