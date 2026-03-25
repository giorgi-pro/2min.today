<script lang="ts">
  import NewsTags from './NewsTags.svelte';

  type Props = {
    title: string;
    bullets: string[];
    whyItMatters: string;
    source: string;
    isBreaking: boolean;
    isLive: boolean;
    tags: string[];
  };

  const { title, bullets, whyItMatters, source, isBreaking, isLive, tags }: Props = $props();
</script>

<style>
  @keyframes neon-pulse {
    0%, 100% { box-shadow: 0 0 4px 1px rgba(255, 99, 71, 0.2); }
    50%       { box-shadow: 0 0 2px 1px rgba(255, 99, 71, 0.5); }
  }
  .dot-pulse { animation: neon-pulse 2s ease-in-out infinite; }
</style>

<div
  class="news-tile flex h-full min-w-[min(100%,280px)] flex-col p-2 pb-[4px]
    {isLive ? 'bg-[#F0F2F4]' : ''}"
>
  <div class="mb-1 flex w-0 min-w-full flex-none items-start justify-between gap-4">
    {#if isLive}
      <span class="font-mono text-[0.55rem] font-bold uppercase tracking-widest text-[#637588]">Live</span>
      <span class="ml-auto font-mono text-[0.55rem] uppercase tracking-widest text-[#637588]/60">{source}</span>
    {:else}
      {#if isBreaking}
        <span class="dot-pulse mt-[3px] block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6347]"></span>
      {/if}
      <span class="ml-auto font-mono text-[0.55rem] uppercase tracking-widest text-black/40">{source}</span>
    {/if}
  </div>

  <h2
    class="mb-3 flex-none text-lg font-bold leading-snug tracking-tight
      {isLive ? 'text-[#181c20]' : 'text-black'}"
  >{title}</h2>

  <ul class="min-h-0 w-0 min-w-full flex-1 space-y-1.5 overflow-hidden">
    {#each bullets as bullet}
      <li class="flex gap-2 text-[0.8rem] leading-snug {isLive ? 'text-[#3d4754]' : 'text-black'}">
        <span class="mt-[0.35rem] block h-[3px] w-[3px] shrink-0 {isLive ? 'bg-[#637588]' : 'bg-black'}"></span>
        <span>{bullet}</span>
      </li>
    {/each}
  </ul>

  <div class="mt-3 w-0 min-w-full flex-none">
    <div class="mb-2 border-t {isLive ? 'border-[#637588]/20' : 'border-black/15'}"></div>
    {#if !isLive}
      <p class="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-black/30">Why it matters</p>
      <p class="border-l border-black/20 pl-2 text-[0.7rem] italic leading-tight text-black/55">{whyItMatters}</p>
    {/if}
    <NewsTags {tags} />
  </div>
</div>
