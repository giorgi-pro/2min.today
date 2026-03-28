<script lang="ts">
  import MobileNewsCard from './MobileNewsCard.svelte';
  import type { NewsItem } from '@2min.today/types';

  interface Props {
    news: NewsItem[];
  }

  const { news }: Props = $props();

  let scrollEl = $state<HTMLElement | undefined>();
  let currentIndex = $state(0);

  function onScroll(e: Event) {
    const el = e.currentTarget as HTMLElement;
    currentIndex = Math.round(el.scrollLeft / el.clientWidth);
  }

  function scrollTo(i: number) {
    scrollEl?.scrollTo({ left: i * (scrollEl.clientWidth), behavior: 'smooth' });
  }
</script>

{#if news.length === 0}
  <div class="flex items-center justify-center px-6 py-12">
    <p class="font-mono text-[0.65rem] uppercase tracking-widest text-black/30">No news found</p>
  </div>
{:else}
  <div
    bind:this={scrollEl}
    class="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    onscroll={onScroll}
  >
    {#each news as item (item.title)}
      <MobileNewsCard
        title={item.title}
        bullets={item.bullets}
        whyItMatters={item.whyItMatters}
        credits={item.credits}
        isBreaking={item.isBreaking}
        isLive={item.isLive}
        tags={item.tags}
      />
    {/each}
  </div>

  {#if news.length > 1}
    <div class="flex justify-center gap-2 border-t-[0.5px] border-black/10 py-3">
      {#each news as _, i (i)}
        <button
          type="button"
          class="h-1.5 w-1.5 transition-colors {i === currentIndex ? 'bg-black' : 'bg-black/20'}"
          onclick={() => scrollTo(i)}
          aria-label="Go to story {i + 1}"
        ></button>
      {/each}
    </div>
  {/if}
{/if}
