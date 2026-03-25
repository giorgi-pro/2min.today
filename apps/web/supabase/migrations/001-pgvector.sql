create extension if not exists vector;

create table clusters (
  id            uuid primary key default gen_random_uuid(),
  embedding     vector(768),
  raw_items     jsonb,
  summary       jsonb,
  bucket        text,
  category_line text,
  published_at  timestamptz default now()
);

create index idx_clusters_embedding on clusters using hnsw (embedding vector_cosine_ops);

create table if not exists bucket_anchors (
  bucket    text primary key
    check (bucket in ('World', 'Business', 'Tech', 'Science', 'Health')),
  embedding vector(768) not null
);
