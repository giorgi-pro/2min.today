<script lang="ts">
  import NewsTags from './NewsTags.svelte';

  type Props = {
    title: string;
    bullets: string[];
    whyItMatters: string;
    source: string;
    isBreaking: boolean;
    tags: string[];
  };

  const { title, bullets, whyItMatters, source, isBreaking, tags }: Props = $props();
</script>

<style>
  @keyframes neon-pulse {
    0%, 100% {
      box-shadow: 0 0 3px 1px rgba(255, 99, 71, 0.2);
    }
    50% {
      box-shadow: 0 0 6px 2px rgba(255, 99, 71, 0.5);
    }
  }

  .dot-pulse {
    animation: neon-pulse 2s ease-in-out infinite;
  }
</style>

<div class="news-tile flex h-full min-w-[min(100%,280px)] flex-col p-2 pb-[4px]">
  <div class="mb-1 flex w-0 min-w-full flex-none justify-between gap-4 items-start">
    {#if isBreaking}
      <span class="dot-pulse mt-[3px] block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6347]"></span>
    {/if}
    <span class="ml-auto font-mono text-[0.55rem] uppercase tracking-widest text-black/40">{source}</span>
  </div>

  <h2 class="mb-3 flex-none text-lg font-bold leading-snug tracking-tight text-black">{title}</h2>

  <ul class="min-h-0 w-0 min-w-full flex-1 space-y-1.5 overflow-hidden">
    {#each bullets as bullet}
      <li class="flex gap-2 text-[0.8rem] leading-snug text-black">
        <span class="mt-[0.35rem] block h-[3px] w-[3px] shrink-0 bg-black"></span>
        <span>{bullet}</span>
      </li>
    {/each}
  </ul>

  <div class="mt-3 w-0 min-w-full flex-none">
    <div class="mb-2 border-t border-black/15"></div>
    <p class="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-black/30">Why it matters</p>
    <p class="border-l border-black/20 pl-2 text-[0.7rem] italic leading-tight text-black/55">{whyItMatters}</p>
    <NewsTags {tags} />
  </div>
</div>
