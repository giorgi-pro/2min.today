import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "@2min.today/data/db";

// Apply the idempotent schema (pgvector + tables + indexes) to DATABASE_URL.
// For a brand-new Docker volume this runs automatically via init; use this to
// set up an existing database.
const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, "../data/schema.sql");

async function main() {
  const sql = readFileSync(schemaPath, "utf8");
  const db = getDb();
  console.log(`Applying schema from ${schemaPath}`);
  try {
    await db.query(sql);
    console.log("Schema applied.");
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(
    "db:setup failed:",
    err instanceof Error ? (err.stack ?? err.message) : String(err),
  );
  process.exitCode = 1;
});
