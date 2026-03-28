<script lang="ts">
  import NewsCard from './NewsCard.svelte';
  import type { CategoryEntry } from '@2min.today/types';

  interface Props {
    categories: CategoryEntry[];
  }

  const { categories }: Props = $props();

  let expandedBucket = $state<string | null>(null);

  function toggle(bucket: string) {
    expandedBucket = expandedBucket === bucket ? null : bucket;
  }
</script>

<div class="flex flex-col">
  {#each categories as { bucket, index, summary, news } (bucket)}
    <div class="border-b-2 border-black">
      <button
        type="button"
        class="flex h-[30vh] w-full flex-col justify-between border-0 p-0 text-left
          {index % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black border-b border-black'}"
        onclick={() => toggle(bucket)}
        aria-expanded={expandedBucket === bucket}
      >
        <span class="m-6 text-xl font-black uppercase leading-none tracking-tight">{bucket}</span>
        <ul class="summary-text m-3 space-y-1 text-right">
          {#each summary as line (line)}
            <li>{line}.</li>
          {/each}
        </ul>
      </button>

      <div
        class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style="max-height: {expandedBucket === bucket ? '30vh' : '0'};"
      >
        <div class="news-scroll flex h-[30vh]">
          {#if news.length === 0}
            <div class="flex h-full w-full items-center justify-center px-6">
              <p class="font-mono text-[0.65rem] uppercase tracking-widest text-black/30">No news found</p>
            </div>
          {:else}
            {#each news as item (item.title)}
              <NewsCard
                title={item.title}
                bullets={item.bullets}
                whyItMatters={item.whyItMatters}
                credits={item.credits}
                isBreaking={item.isBreaking}
                isLive={item.isLive}
                tags={item.tags}
              />
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>
