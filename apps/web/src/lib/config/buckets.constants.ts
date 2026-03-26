export type Bucket = 'World' | 'Business' | 'Tech' | 'Science' | 'Health' | 'Emerging';

/** Homepage digest columns (excludes Emerging; Emerging rows still persist for ops / future use). */
export const DIGEST_DISPLAY_BUCKETS: Bucket[] = ['World', 'Business', 'Tech', 'Science', 'Health'];

export const BUCKET_ORDER: Bucket[] = [...DIGEST_DISPLAY_BUCKETS, 'Emerging'];
