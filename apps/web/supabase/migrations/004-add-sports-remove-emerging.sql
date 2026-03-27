-- Expand to 10 buckets (5 geographic + 5 topical), remove emerging.
-- Reclassify existing emerging rows to world.

update clusters set bucket = 'world' where lower(bucket) = 'emerging';

alter table bucket_anchors drop constraint if exists bucket_anchors_bucket_check;

alter table bucket_anchors add constraint bucket_anchors_bucket_check
  check (bucket in ('usa', 'europe', 'middle-east', 'americas', 'world', 'business', 'tech', 'science', 'health', 'sports'));
