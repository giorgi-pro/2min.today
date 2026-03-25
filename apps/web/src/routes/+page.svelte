<script lang="ts">
  import Fuse from 'fuse.js';
  import { BUCKET_ORDER, type Bucket } from '$lib/config/buckets';
  import { buildMockDigest } from '$lib/mock-digest';
  import {
    debouncedSearchQuery,
    selectedTags,
    toggleTag,
    clearAllFilters,
  } from '$lib/digest-filter';
  import type { DigestCard } from './+page.server';
  import CategoryRow from '@2min.today/ui/components/digest/CategoryRow.svelte';

  type Category = {
    name: string;
    summary: string[];
    news: {
      title: string;
      bullets: string[];
      whyItMatters: string;
      source: string;
      isBreaking: boolean;
      tags: string[];
    }[];
  };

  const { data } = $props<{
    data: { digest: Partial<Record<string, DigestCard[]>>; fuseThreshold: number };
  }>();

  let debouncedQ = $state('');
  let selTags = $state<string[]>([]);

  $effect(() => {
    const u1 = debouncedSearchQuery.subscribe((v) => {
      debouncedQ = v;
    });
    const u2 = selectedTags.subscribe((v) => {
      selTags = v;
    });
    return () => {
      u1();
      u2();
    };
  });

  const sourceDigest = $derived(
    data.digest && Object.keys(data.digest).length > 0
      ? (data.digest as Partial<Record<Bucket, DigestCard[]>>)
      : buildMockDigest(),
  );

  type CardRow = DigestCard & { bucket: Bucket };

  const allCards = $derived(
    Object.entries(sourceDigest).flatMap(([bucket, cards]) =>
      (cards ?? []).map((c) => ({ ...c, bucket: bucket as Bucket })),
    ) as CardRow[],
  );

  const fuse = $derived(
    new Fuse(allCards, {
      keys: [
        'headline',
        'whyItMatters',
        {
          name: 'bullets',
          getFn: (c: CardRow) => c.bullets.join(' '),
        },
      ],
      threshold: data.fuseThreshold,
      ignoreLocation: true,
    }),
  );

  const filteredCards = $derived.by(() => {
    const selectedSet = new Set(selTags);
    let results = allCards;
    const q = debouncedQ.trim();
    if (q) {
      results = fuse.search(q).map((r) => r.item);
    }
    if (selectedSet.size > 0) {
      results = results.filter((card) => card.tags.some((t) => selectedSet.has(t)));
    }
    return results;
  });

  const filteredDigest = $derived(
    filteredCards.reduce<Partial<Record<Bucket, DigestCard[]>>>((acc, card) => {
      const b = card.bucket;
      if (!acc[b]) acc[b] = [];
      const list = acc[b] as DigestCard[];
      list.push(card);
      return acc;
    }, {}),
  );

  function liveToCategories(digest: Partial<Record<string, DigestCard[]>>): Category[] {
    return BUCKET_ORDER
      .filter((b) => digest[b]?.length)
      .map((b) => ({
        name: b,
        summary: (digest[b] ?? []).slice(0, 5).map((c) => c.headline),
        news: (digest[b] ?? []).map((c) => ({
          title: c.headline,
          bullets: c.bullets,
          whyItMatters: c.whyItMatters,
          source: c.categoryLine ?? b,
          isBreaking: false,
          tags: c.tags,
        })),
      }));
  }

  const categories: Category[] = $derived(liveToCategories(filteredDigest));

  const hasActiveFilters = $derived(debouncedQ.trim().length > 0 || selTags.length > 0);

  const showFilteredEmpty = $derived(
    hasActiveFilters && allCards.length > 0 && filteredCards.length === 0,
  );
</script>

<svelte:head>
  <title>2min.today</title>
  <meta
    name="description"
    content="2min.today is a daily, informationally dense Global Digest that summarizes the world's most significant news into a precise two-minute read."
  />
</svelte:head>

{#if hasActiveFilters}
  <div
    class="flex flex-wrap items-center gap-[0.7rem] border-b-2 border-black bg-surface-container-low px-6 py-2 md:px-8"
  >
    {#each selTags as tag}
      <button
        type="button"
        class="font-mono text-[0.55rem] uppercase tracking-widest border-2 border-black bg-white px-2 py-1 text-black hover:bg-black hover:text-white"
        onclick={() => toggleTag(tag)}
      >
        {tag} ×
      </button>
    {/each}
    <button
      type="button"
      class="ml-auto font-mono text-[0.55rem] uppercase tracking-widest text-tertiary hover:text-primary"
      onclick={clearAllFilters}
    >
      Clear filters
    </button>
  </div>
{/if}

{#if showFilteredEmpty}
  <p class="border-b-2 border-black px-6 py-10 text-center text-sm text-black/55 md:px-8">
    No matches. Try broadening search or clearing tags.
  </p>
{/if}

<div>
  {#each categories as category, i}
    <CategoryRow
      name={category.name}
      summary={category.summary}
      news={category.news}
      index={i}
      selectedTags={selTags}
      onToggleTag={toggleTag}
    />
  {/each}
</div>
