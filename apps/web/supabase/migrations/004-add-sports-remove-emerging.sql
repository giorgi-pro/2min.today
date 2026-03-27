-- Add sports bucket, remove emerging: reclassify existing emerging rows to world.

update clusters set bucket = 'world' where lower(bucket) = 'emerging';

alter table bucket_anchors drop constraint if exists bucket_anchors_bucket_check;

alter table bucket_anchors add constraint bucket_anchors_bucket_check
  check (bucket in ('world', 'business', 'tech', 'science', 'health', 'sports'));
