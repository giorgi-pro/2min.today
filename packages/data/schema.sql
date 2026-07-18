-- 2min.today Postgres schema (source of truth).
-- Idempotent: safe to run against a fresh or existing database.
-- Apply locally with: pnpm --filter @2min.today/web run db:setup
-- (or psql "$DATABASE_URL" -f packages/data/schema.sql)

create extension if not exists vector;

-- A story cluster is classified on two orthogonal axes:
--   region = where it happened, topic = what it is about.
create table if not exists clusters (
  id            uuid primary key default gen_random_uuid(),
  embedding     vector(768),
  raw_items     jsonb,
  summary       jsonb,
  region        text,
  topic         text,
  published_at  timestamptz default now()
);

create index if not exists idx_clusters_embedding
  on clusters using hnsw (embedding vector_cosine_ops);

create index if not exists idx_clusters_region on clusters (region);
create index if not exists idx_clusters_topic on clusters (topic);

-- Topic classification seeds (one embedding per topic).
create table if not exists topic_anchors (
  topic     text primary key
    check (topic in (
      'politics', 'conflict', 'business', 'tech',
      'science', 'health', 'environment', 'society'
    )),
  embedding vector(768) not null
);
