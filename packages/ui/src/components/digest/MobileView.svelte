<script lang="ts">
  import NewsCard from './NewsCard.svelte';

  type Credit = { source: string; url: string };

  type NewsItem = {
    title: string;
    bullets: string[];
    whyItMatters: string;
    credits: Credit[];
    isBreaking: boolean;
    isLive: boolean;
    tags: string[];
  };

  type CategoryEntry = {
    bucket: string;
    index: number;
    news: NewsItem[];
  };

  type Props = {
    categories: CategoryEntry[];
  };

  const { categories }: Props = $props();

  let expandedBucket = $state<string | null>(null);

  function toggle(bucket: string) {
    expandedBucket = expandedBucket === bucket ? null : bucket;
  }

</script>

<div class="flex flex-col">
  {#each categories as { bucket, index, news }}
    <div class="border-b-2 border-black">
      <button
        type="button"
        class="flex h-[30vh] w-full flex-col border-1 p-0 text-left
          {index % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black border-b border-black'}"
        onclick={() => toggle(bucket)}
        aria-expanded={expandedBucket === bucket}
      >
        <span class="m-6 text-xl font-black uppercase leading-none tracking-tight">{bucket}</span>
      </button>

      <div
        class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style="max-height: {expandedBucket === bucket ? '30vh' : '0'};"
      >
        <div class="relative">
          <div
            class="news-scroll flex h-[30vh]"
          >
            {#if news.length === 0}
              <div class="flex h-full w-full items-center justify-center px-6">
                <p class="font-mono text-[0.65rem] uppercase tracking-widest text-black/30">No news found</p>
              </div>
            {:else}
              {#each news as item}
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
    </div>
  {/each}
</div>
