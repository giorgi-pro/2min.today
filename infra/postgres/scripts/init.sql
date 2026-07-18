-- PostgreSQL initialization scripts.
-- Executed when the Postgres container starts for the first time.
--
-- gen_random_uuid() lives in pgcrypto, which is part of contrib and bundled
-- with the official postgres image. It is also a built-in since Postgres 13,
-- so no extension is required for the current Drizzle schema. Add extensions
-- here only when an actual table or query needs them.

SET timezone = 'UTC';
