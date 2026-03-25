import { parse } from 'yaml';
import fs from 'fs';
import path from 'path';

const raw = fs.readFileSync(path.join(process.cwd(), 'src/lib/config/buckets.yaml'), 'utf8');
export const BUCKET_ANCHORS = parse(raw).buckets as Record<string, string>;
export type Bucket = 'World' | 'Business' | 'Tech' | 'Science' | 'Health' | 'Emerging';
export const BUCKET_ORDER: Bucket[] = ['World', 'Business', 'Tech', 'Science', 'Health', 'Emerging'];
