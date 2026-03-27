import type { Bucket } from '../config/buckets';
import type { Credit, Region } from './digest';

export type SummaryJson = {
  headline: string;
  bullets: string[];
  why_it_matters: string;
  credits?: { source: string; url: string }[];
  tags?: unknown;
  region?: unknown;
};

export type DigestCard = {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  tags: string[];
  region: Region;
  categoryLine: string | null;
  credits: Credit[];
  bucket: Bucket;
  isBreaking: boolean;
  isLive: boolean;
};
