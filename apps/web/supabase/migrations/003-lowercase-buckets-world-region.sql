-- Lowercase bucket slugs; region slug `world` replaces `global`; fix rows where region was stored in `bucket`.

alter table bucket_anchors drop constraint if exists bucket_anchors_bucket_check;

update bucket_anchors set bucket = 'world' where bucket = 'World';
update bucket_anchors set bucket = 'business' where bucket = 'Business';
update bucket_anchors set bucket = 'tech' where bucket = 'Tech';
update bucket_anchors set bucket = 'science' where bucket = 'Science';
update bucket_anchors set bucket = 'health' where bucket = 'Health';

alter table bucket_anchors add constraint bucket_anchors_bucket_check
  check (bucket in ('world', 'business', 'tech', 'science', 'health'));

update clusters set bucket = 'world' where lower(bucket) = 'global';
update clusters set bucket = 'world' where bucket = 'World';
update clusters set bucket = 'business' where bucket = 'Business';
update clusters set bucket = 'tech' where bucket = 'Tech';
update clusters set bucket = 'science' where bucket = 'Science';
update clusters set bucket = 'health' where bucket = 'Health';
update clusters set bucket = 'emerging' where bucket = 'Emerging';

update clusters
set summary = jsonb_set(summary::jsonb, '{region}', to_jsonb('world'::text), true)
where summary is not null
  and summary ? 'region'
  and lower(summary->>'region') = 'global';
