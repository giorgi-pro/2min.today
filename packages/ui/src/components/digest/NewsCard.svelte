<script lang="ts">
  import NewsTags from './NewsTags.svelte';

  type Credit = { source: string; url: string };

  type Props = {
    title: string;
    bullets: string[];
    whyItMatters: string;
    credits: Credit[];
    isBreaking: boolean;
    isLive: boolean;
    tags: string[];
  };

  const { title, bullets, whyItMatters, credits, isBreaking, isLive, tags }: Props = $props();

  let open = $state(false);
  let cardEl: HTMLDivElement;

  function onCardClick(e: MouseEvent) {
    if (!open) return;
    const target = e.target as Node;
    const btn = cardEl.querySelector('button[aria-label="Toggle sources"]');
    if (btn?.contains(target)) return;
    open = false;
  }
</script>

<style>
  @keyframes neon-pulse {
    0%, 100% { box-shadow: 0 0 4px 1px rgba(255, 99, 71, 0.2); }
    50%       { box-shadow: 0 0 2px 1px rgba(255, 99, 71, 0.5); }
  }
  .dot-pulse { animation: neon-pulse 2s ease-in-out infinite; }
</style>

<div
  bind:this={cardEl}
  class="news-tile relative flex h-full min-w-[min(100%,280px)] flex-col p-2 pb-[4px]
    {isLive ? 'bg-[#F0F2F4]' : ''}"
  onclick={onCardClick}
  role="presentation"
>
  <div class="mb-1 flex w-0 min-w-full flex-none items-start gap-4">
    {#if isLive}
      <span class="font-mono text-[0.55rem] font-bold uppercase tracking-widest text-[#637588]">Live</span>
    {:else if isBreaking}
      <span class="dot-pulse mt-[3px] block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6347]"></span>
    {/if}
  </div>

  <button
    class="absolute right-2 top-1.5 cursor-pointer font-mono text-[1rem] font-bold leading-none transition-colors
      {isLive ? 'text-[#637588]/60 hover:text-[#637588]' : 'text-black hover:text-black/70'}"
    onclick={() => (open = !open)}
    aria-label="Toggle sources"
  >©</button>

  {#if open}
    <div
      class="credits-dropdown absolute right-2 top-6 z-10 max-h-40 w-[26rem] border border-black/10 bg-white"
      role="dialog"
      aria-label="Sources"
    >
      {#if credits.length === 0}
        <p class="px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-black/30">Source unavailable</p>
      {:else}
        <table class="w-full border-collapse">
          <tbody>
            {#each credits as credit}
              <tr class="border-b border-black/5 last:border-0">
                <td class="w-px whitespace-nowrap py-2 pl-3 pr-3 font-mono text-[0.55rem] uppercase tracking-widest text-black/40">{credit.source}</td>
                <td class="py-2 pr-3">
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block truncate text-[0.65rem] text-black underline underline-offset-2"
                  >{credit.url}</a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}

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
