<script lang="ts">
  import { flip } from 'svelte/animate';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { dragHandleZone, type DndEvent } from 'svelte-dnd-action';
  import { DIGEST_DISPLAY_BUCKETS, type Bucket } from '$lib/config/buckets.constants';
  import {
    CATEGORY_ORDER_STORAGE_KEY,
    CATEGORY_MINIMIZED_STORAGE_KEY,
    normalizeStoredBucketKey,
    resolveCategoryOrder,
  } from '$lib/category-order';
  import { buildMockDigest } from '$lib/mock-digest';
  import { debouncedSearchQuery, activeRegions } from '$lib/digest-filter';
  import { SearchHandler, ThresholdStrategy } from '$lib/search/search-handler';
  import type { DigestCard } from './+page.server';
  import type { Region, Credit } from '$lib/types/digest';
  import CategoryRow from '@2min.today/ui/components/digest/CategoryRow.svelte';
  import MobileView from '@2min.today/ui/components/digest/MobileView.svelte';

  type DndBucketItem = { id: Bucket; bucket: Bucket };

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
    const mq = window.matchMedia('(max-width: 576px)');
    isMobile = mq.matches;
    const mqHandler = (e: MediaQueryListEvent) => { isMobile = e.matches; };
    mq.addEventListener('change', mqHandler);

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

    return () => mq.removeEventListener('change', mqHandler);
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

  let isMobile = $state(false);

  let dndItems = $state<DndBucketItem[]>([]);
  let dndDragging = $state(false);
  const flipDurationMs = 150;

  $effect.pre(() => {
    if (dndDragging) return;
    dndItems = displayOrder.map((b) => ({ id: b, bucket: b }));
  });

  function handleDndConsider(e: CustomEvent<DndEvent<DndBucketItem>>) {
    dndDragging = true;
    dndItems = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<DndBucketItem>>) {
    dndItems = e.detail.items;
    persistBucketOrder(dndItems.map((i) => i.bucket));
    dndDragging = false;
  }

  function styleCategoryDragPreview(element: HTMLElement, _data: unknown, _index: number) {
    element.style.setProperty('outline', 'none', 'important');
    element.style.setProperty('border', '2px solid #000000', 'important');
    element.style.setProperty('background-color', '#ffffff', 'important');
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

  const mobileCategories = $derived(
    displayOrder.map((b, i) => ({
      bucket: b,
      index: i,
      news: categoryByBucket[b]?.news ?? [],
    })),
  );

</script>

<svelte:head>
  <title>&#x200E;</title>
  <meta
    name="description"
    content="2min.today is a daily, informationally dense Global Digest that summarizes the world's most significant news into a precise two-minute read."
  />
</svelte:head>

{#if isMobile}
  <MobileView categories={mobileCategories} />
{:else}
  <div
    aria-label="News categories, drag rows to reorder"
    role="region"
    use:dragHandleZone={{
      items: dndItems,
      flipDurationMs,
      dropTargetStyle: { outline: 'none' },
      transformDraggedElement: styleCategoryDragPreview,
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#each dndItems as item, i (item.id)}
      <div class="-mt-[2px] border-2 border-black" animate:flip={{ duration: flipDurationMs }}>
        {#if categoryByBucket[item.bucket]}
          {@const category = categoryByBucket[item.bucket] as Category}
          <CategoryRow
            name={category.name}
            summary={category.summary}
            news={category.news}
            index={i}
            minimized={minimizedBuckets.has(item.bucket)}
            dragging={dndDragging}
            onMinimize={() => minimizeBucket(item.bucket)}
            onExpand={() => expandBucket(item.bucket)}
            reorderable
          />
        {/if}
      </div>
    {/each}
  </div>
{/if}
