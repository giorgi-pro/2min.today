alter table clusters
  add column if not exists is_live    boolean not null default false,
  add column if not exists source_url text;

create index if not exists idx_clusters_source_url on clusters (source_url)
  where source_url is not null;
