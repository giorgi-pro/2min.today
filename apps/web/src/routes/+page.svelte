<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { DIGEST_DISPLAY_BUCKETS, type Bucket } from '$lib/config/buckets.constants';
  import {
    CATEGORY_ORDER_STORAGE_KEY,
    CATEGORY_MINIMIZED_STORAGE_KEY,
    normalizeStoredBucketKey,
    reorderCategoryBuckets,
    resolveCategoryOrder,
  } from '$lib/category-order';
  import { buildMockDigest } from '$lib/mock-digest';
  import { debouncedSearchQuery, activeRegions } from '$lib/digest-filter';
  import { SearchHandler, ThresholdStrategy } from '$lib/search/search-handler';
  import type { DigestCard } from './+page.server';
  import type { Region, Credit } from '$lib/types/digest';
  import CategoryRow from '@2min.today/ui/components/digest/CategoryRow.svelte';

  const BUCKET_MIME = 'application/x-2min-bucket';

  type Category = {
    name: string;
    summary: string[];
    news: {
      title: string;
      bullets: string[];
      whyItMatters: string;
      credits: Credit[];
      isBreaking: boolean;
      isLive: boolean;
      tags: string[];
    }[];
  };

  const { data } = $props<{
    data: {
      digest: Partial<Record<string, DigestCard[]>>;
      summaries: Partial<Record<string, string[]>>;
      fuseThreshold: number;
      useMockData: boolean;
    };
  }>();

  let debouncedQ = $state('');
  let regions = $state<Set<Region>>(new Set());

  $effect(() => {
    const u = debouncedSearchQuery.subscribe((v) => { debouncedQ = v; });
    return () => u();
  });

  $effect(() => {
    const u = activeRegions.subscribe((v) => { regions = v; });
    return () => u();
  });

  const sourceDigest = $derived(
    data.digest && Object.keys(data.digest).length > 0
      ? (data.digest as Partial<Record<Bucket, DigestCard[]>>)
      : data.useMockData
        ? (buildMockDigest().cards as Partial<Record<Bucket, DigestCard[]>>)
        : ({} as Partial<Record<Bucket, DigestCard[]>>),
  );

  type CardRow = DigestCard & { bucket: Bucket };

  const allCards = $derived(
    Object.entries(sourceDigest)
      .flatMap(([bucket, cards]) =>
        (cards ?? []).map((c) => ({ ...c, bucket: bucket as Bucket })),
      ) as CardRow[],
  );

  const handler = $derived(
    new SearchHandler(
      new ThresholdStrategy<CardRow>({
        keys: [
          'headline',
          'whyItMatters',
          { name: 'bullets', getFn: (c: CardRow) => c.bullets.join(' ') },
        ],
        ignoreLocation: true,
      }),
      data.fuseThreshold,
    ),
  );

  const searchedCards = $derived(handler.handle(debouncedQ, allCards));

  const filteredCards = $derived(
    regions.size === 0 ? searchedCards : searchedCards.filter((c) => regions.has(c.region)),
  );

  const filteredDigest = $derived(
    filteredCards.reduce<Partial<Record<Bucket, DigestCard[]>>>((acc, card) => {
      const b = card.bucket;
      if (!acc[b]) acc[b] = [];
      const list = acc[b] as DigestCard[];
      list.push(card);
      return acc;
    }, {}),
  );

  const presentBuckets = $derived(
    DIGEST_DISPLAY_BUCKETS.filter((b) => sourceDigest[b]?.length) as Bucket[],
  );

  let savedBucketOrder = $state<Bucket[]>([]);
  let minimizedBuckets = $state<Set<Bucket>>(new Set());

  onMount(() => {
    try {
      const rawOrder = localStorage.getItem(CATEGORY_ORDER_STORAGE_KEY);
      if (rawOrder) {
        const parsed = JSON.parse(rawOrder) as unknown;
        if (Array.isArray(parsed)) {
          savedBucketOrder = parsed
            .map((x) => (typeof x === 'string' ? normalizeStoredBucketKey(x) : null))
            .filter((x): x is Bucket => x != null);
        }
      }
    } catch {
      /* ignore */
    }
    try {
      const rawMin = localStorage.getItem(CATEGORY_MINIMIZED_STORAGE_KEY);
      if (rawMin) {
        const parsed = JSON.parse(rawMin) as unknown;
        if (Array.isArray(parsed)) {
          minimizedBuckets = new Set(
            parsed
              .map((x) => (typeof x === 'string' ? normalizeStoredBucketKey(x) : null))
              .filter((x): x is Bucket => x != null),
          );
        }
      }
    } catch {
      /* ignore */
    }
  });

  const baseOrder = $derived(resolveCategoryOrder(savedBucketOrder, presentBuckets));
  const displayOrder = $derived(baseOrder);

  function persistBucketOrder(next: Bucket[]) {
    savedBucketOrder = next;
    if (browser) {
      localStorage.setItem(CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(next));
    }
  }

  function persistMinimized(next: Set<Bucket>) {
    minimizedBuckets = next;
    if (browser) {
      localStorage.setItem(CATEGORY_MINIMIZED_STORAGE_KEY, JSON.stringify([...next]));
    }
  }

  function minimizeBucket(bucket: Bucket) {
    const next = new Set(minimizedBuckets);
    next.add(bucket);
    persistMinimized(next);
  }

  function expandBucket(bucket: Bucket) {
    const next = new Set(minimizedBuckets);
    next.delete(bucket);
    persistMinimized(next);
  }

  let draggingBucket = $state<Bucket | null>(null);
  let dragOverBucket = $state<Bucket | null>(null);

  function onPanelDragStart(bucket: Bucket) {
    return (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (!dt) return;
      dt.setData(BUCKET_MIME, bucket);
      dt.setData('text/plain', bucket);
      dt.effectAllowed = 'move';
      draggingBucket = bucket;
    };
  }

  function onPanelDragEnd() {
    draggingBucket = null;
    dragOverBucket = null;
  }

  function onRowDragOver(bucket: Bucket) {
    return (e: DragEvent) => {
      e.preventDefault();
      const dt = e.dataTransfer;
      if (dt) dt.dropEffect = 'move';
      dragOverBucket = bucket;
    };
  }

  function onRowDragLeave(bucket: Bucket) {
    return (e: DragEvent) => {
      const rel = e.relatedTarget as Node | null;
      const cur = e.currentTarget as HTMLElement;
      if (rel && cur.contains(rel)) return;
      if (dragOverBucket === bucket) dragOverBucket = null;
    };
  }

  function onRowDrop(onto: Bucket) {
    return (e: DragEvent) => {
      e.preventDefault();
      const dt = e.dataTransfer;
      const raw = dt?.getData(BUCKET_MIME) || dt?.getData('text/plain');
      dragOverBucket = null;
      draggingBucket = null;
      if (!raw) return;
      const from = raw as Bucket;
      if (from === onto) return;
      persistBucketOrder(reorderCategoryBuckets(displayOrder, from, onto));
    };
  }

  const categoryByBucket = $derived(
    presentBuckets.reduce<Partial<Record<Bucket, Category>>>((acc, b) => {
      acc[b] = {
        name: b,
        summary: data.summaries?.[b] ?? (sourceDigest[b] ?? []).slice(0, 5).map((c) => c.headline),
        news: (filteredDigest[b] ?? []).map((c) => ({
          title: c.headline,
          bullets: c.bullets,
          whyItMatters: c.whyItMatters,
          credits: c.credits,
          isBreaking: c.isBreaking,
          isLive: c.isLive,
          tags: c.tags,
        })),
      };
      return acc;
    }, {}),
  );

</script>

<svelte:head>
  <title>2min.today</title>
  <meta
    name="description"
    content="2min.today is a daily, informationally dense Global Digest that summarizes the world's most significant news into a precise two-minute read."
  />
</svelte:head>

<div>
  {#each displayOrder as bucket, i (bucket)}
    {@const category = categoryByBucket[bucket]}
    {#if category}
      <CategoryRow
        name={category.name}
        summary={category.summary}
        news={category.news}
        index={i}
        minimized={minimizedBuckets.has(bucket)}
        onMinimize={() => minimizeBucket(bucket)}
        onExpand={() => expandBucket(bucket)}
        dragSource={draggingBucket === bucket}
        dragOver={dragOverBucket === bucket}
        onPanelDragStart={onPanelDragStart(bucket)}
        onPanelDragEnd={onPanelDragEnd}
        onRowDragOver={onRowDragOver(bucket)}
        onRowDragLeave={onRowDragLeave(bucket)}
        onRowDrop={onRowDrop(bucket)}
      />
    {/if}
  {/each}
</div>
