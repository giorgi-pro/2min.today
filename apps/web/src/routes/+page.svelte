<script lang="ts">
  import Fuse from 'fuse.js';
  import type { Bucket } from '$lib/config/buckets';
  import { buildMockDigest } from '$lib/mock-digest';
  import {
    debouncedSearchQuery,
    selectedTags,
    toggleTag,
    clearAllFilters,
  } from '$lib/digest-filter';
  import type { DigestCard } from './+page.server';

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

  const bucketOrder = ['World', 'Business', 'Tech', 'Science', 'Health', 'Emerging'] as const;

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
    return bucketOrder
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

  const MAX_BUCKETS = 8;
  let thumbPositions: number[] = $state(new Array(MAX_BUCKETS).fill(0));
  let scrollEls: HTMLElement[] = [];
  let marqueeFrames: (number | null)[] = new Array(MAX_BUCKETS).fill(null);
  let marqueeSpeeds: number[] = new Array(MAX_BUCKETS).fill(0);
  let marqueeEnabled: boolean[] = $state(new Array(MAX_BUCKETS).fill(true));
  let pressed: boolean[] = $state(new Array(MAX_BUCKETS).fill(false));

  const MAX_SPEED = 2.5;

  function onScroll(e: Event, i: number) {
    const el = e.currentTarget as HTMLElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    const thumbWidth = window.innerWidth * 0.2;
    const trackWidth = el.clientWidth;
    thumbPositions[i] = ratio * Math.max(0, trackWidth - thumbWidth - 1);
  }

  let categoryEls: HTMLElement[] = [];

  function onCategoryMouseMove(e: MouseEvent, i: number) {
    if (!marqueeEnabled[i]) return;
    const rect = categoryEls[i].getBoundingClientRect();
    const offset = (e.clientX - rect.left) / rect.width;
    marqueeSpeeds[i] = (offset - 0.5) * 2 * MAX_SPEED;
  }

  function startMarquee(i: number) {
    if (!marqueeEnabled[i]) return;
    const el = scrollEls[i];
    if (!el) return;

    function tick() {
      el.scrollLeft += marqueeSpeeds[i];
      marqueeFrames[i] = requestAnimationFrame(tick);
    }

    marqueeFrames[i] = requestAnimationFrame(tick);
  }

  function stopMarquee(i: number) {
    if (marqueeFrames[i] != null) {
      cancelAnimationFrame(marqueeFrames[i] as number);
      marqueeFrames[i] = null;
    }
    marqueeSpeeds[i] = 0;
  }

  function toggleMarquee(e: MouseEvent, i: number) {
    marqueeEnabled[i] = !marqueeEnabled[i];
    if (marqueeEnabled[i]) {
      onCategoryMouseMove(e, i);
      startMarquee(i);
    } else {
      stopMarquee(i);
    }

    pressed[i] = true;
    setTimeout(() => (pressed[i] = false), 150);
  }
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

<div class="border-t-2 border-black">
  {#each categories as category, i}
    <div class="grid border-b-2 border-black" style="grid-template-columns: 30vh 1fr">
      <div
        role="presentation"
        class="flex h-[30vh] flex-col justify-between transition-transform duration-150 ease-out 
          {i % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black border-r-2 border-black'}
          {marqueeEnabled[i] ? 'cursor-grab' : 'cursor-pointer'}"
        style:transform={pressed[i] ? 'translate(-1px, 1px)' : ''}
        bind:this={categoryEls[i]}
        onmouseenter={() => startMarquee(i)}
        onmouseleave={() => stopMarquee(i)}
        onmousemove={(e) => onCategoryMouseMove(e, i)}
        onclick={(e) => toggleMarquee(e, i)}
      >
        <span class="m-6 whitespace-nowrap text-xl font-black uppercase leading-none tracking-tight">
          {category.name}
        </span>
        <ul class="m-3 space-y-1 text-right">
          {#each category.summary as line}
            <li class="text-[0.55rem] leading-tight opacity-60">{line}.</li>
          {/each}
        </ul>
      </div>

      <div class="relative overflow-hidden">
        <div
          class="news-scroll flex h-[30vh] overflow-x-scroll overflow-y-hidden divide-x divide-black/10"
          bind:this={scrollEls[i]}
          onscroll={(e) => onScroll(e, i)}
        >
          {#each category.news as item}
            <div class="news-tile relative flex h-full min-w-[min(100%,280px)] flex-col p-5">
              <div class="mb-3 flex w-0 min-w-full flex-none items-center justify-between gap-4">
                {#if item.isBreaking}
                  <span
                    class="bg-black px-2 py-0.5 font-mono text-[0.55rem] font-medium uppercase tracking-widest text-white"
                  >
                    Breaking
                  </span>
                {:else}
                  <span class="font-mono text-[0.55rem] uppercase tracking-widest text-black/30">
                    Update
                  </span>
                {/if}
                <span class="ml-auto font-mono text-[0.55rem] uppercase tracking-widest text-black/40">
                  {item.source}
                </span>
              </div>

              <h2 class="mb-3 flex-none text-lg font-bold leading-snug tracking-tight text-black">
                {item.title}
              </h2>

              <ul class="min-h-0 w-0 min-w-full flex-1 space-y-1.5 overflow-hidden">
                {#each item.bullets as bullet}
                  <li class="flex gap-2 text-[0.8rem] leading-snug text-black">
                    <span class="mt-[0.35rem] block h-[3px] w-[3px] shrink-0 bg-black"></span>
                    <span>{bullet}</span>
                  </li>
                {/each}
              </ul>

              <div class="mt-3 w-0 min-w-full flex-none">
                <div class="mb-2 border-t border-black/15"></div>
                <p class="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-black/30">
                  Why it matters
                </p>
                <p class="border-l border-black/20 pl-2 text-[0.7rem] italic leading-tight text-black/55">
                  {item.whyItMatters}
                </p>
              </div>

              {#if item.tags.length > 0}
                <div
                  class="pointer-events-auto absolute bottom-3 right-3 flex max-w-[85%] flex-wrap justify-end gap-1"
                >
                  {#each item.tags as tag}
                    <button
                      type="button"
                      class="font-mono text-[11px] uppercase tracking-widest border-2 px-1.5 py-0.5 {selTags.includes(tag)
                        ? 'border-black bg-black text-white'
                        : 'border-transparent bg-surface-container-low text-black/50 hover:border-black/15 hover:text-black'}"
                      aria-pressed={selTags.includes(tag)}
                      onclick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="pointer-events-none absolute bottom-[1px] left-[1px] right-0 h-[4px]">
          <div
            class="absolute top-0 h-full bg-black"
            style="left: {thumbPositions[i]}px; width: 20vw"
          ></div>
        </div>
      </div>
    </div>
  {/each}
</div>
