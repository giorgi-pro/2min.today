<script lang="ts">
  import { BUCKET_ORDER, type Bucket } from '$lib/config/buckets.constants';
  import { buildMockDigest } from '$lib/mock-digest';
  import { debouncedSearchQuery, activeRegions } from '$lib/digest-filter';
  import { SearchHandler, ThresholdStrategy } from '$lib/search/search-handler';
  import type { DigestCard } from './+page.server';
  import type { Region, Credit } from '$lib/types/digest';
  import CategoryRow from '@2min.today/ui/components/digest/CategoryRow.svelte';

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
    data: { digest: Partial<Record<string, DigestCard[]>>; summaries: Partial<Record<string, string[]>>; fuseThreshold: number };
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
      : (buildMockDigest().cards as Partial<Record<Bucket, DigestCard[]>>),
  );

  type CardRow = DigestCard & { bucket: Bucket };

  const allCards = $derived(
    Object.entries(sourceDigest).flatMap(([bucket, cards]) =>
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

  const categories: Category[] = $derived(
    BUCKET_ORDER
      .filter((b) => sourceDigest[b]?.length)
      .map((b) => ({
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
      })),
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
  {#each categories as category, i}
    <CategoryRow name={category.name} summary={category.summary} news={category.news} index={i} />
  {/each}
</div>
