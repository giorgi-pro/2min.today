import { env } from "@2min.today/config/env";
import { Pool } from "pg";

/** A connected Postgres pool. Alias so callers depend on this package, not `pg`. */
export type Db = Pool;

let _pool: Pool | null = null;

/**
 * Lazily create a singleton Postgres pool from `DATABASE_URL`.
 * Standard libpq connection string, e.g. postgresql://user:pass@host:5432/db.
 */
export function getDb(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return _pool;
}
