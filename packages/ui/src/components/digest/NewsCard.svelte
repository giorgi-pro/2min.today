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

<div class="news-tile flex h-full min-w-[min(100%,280px)] flex-col p-2 pb-[4px]">
  <div class="mb-3 flex w-0 min-w-full flex-none items-center justify-between gap-4">
    {#if isBreaking}
      <span class="bg-black px-2 py-0.5 font-mono text-[0.55rem] font-medium uppercase tracking-widest text-white">
        Breaking
      </span>
    {:else}
      <span class="font-mono text-[0.55rem] uppercase tracking-widest text-black/30">Update</span>
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
