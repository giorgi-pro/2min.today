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
    borderRight?: boolean;
  };

  const { title, bullets, whyItMatters, credits, isBreaking, isLive, tags, borderRight = false }: Props = $props();

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
  class="news-tile relative flex h-full min-w-[min(100%,280px)] flex-col py-2 px-2 pb-[4px] {isLive ? 'bg-white' : ''} {borderRight ? 'border-r-2 border-black' : ''}"
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

  <div
    class={isLive
      ? 'mt-1 flex min-h-0 w-0 min-w-full flex-1 flex-col border border-black/15 bg-[#F0F2F4] p-2'
      : 'contents px-4'}
  >
    <h2
      class="mb-3 mx-1 flex-none text-lg font-bold leading-snug tracking-tight {isLive ? 'text-[#181c20]' : 'text-black'}"
    >{title}</h2>
    <ul class="min-h-0 w-0 min-w-full flex-1 space-y-1.5 overflow-hidden mx-1">
      {#each bullets as bullet}
        <li class="flex gap-2 text-[0.8rem] leading-snug {isLive ? 'text-[#3d4754]' : 'text-black'}">
          <span class="mt-[0.35rem] block h-[3px] w-[3px] shrink-0 {isLive ? 'bg-[#637588]' : 'bg-black'}"></span>
          <span>{bullet}</span>
        </li>
      {/each}
    </ul>
  </div>

  <div class="mt-3 w-0 min-w-full flex-none">
    <div class="mb-2 border-t border-black/15"></div>
    <div class="relative {isLive ? 'mb-2' : ''}">
      <button
        type="button"
        class="absolute right-0 top-0 z-[1] cursor-pointer border-0 bg-transparent p-0 font-mono text-[1rem] font-normal uppercase leading-none tracking-widest text-black/50 transition-colors hover:text-black/50"
        onclick={() => (open = !open)}
        aria-label="Toggle sources"
      >©</button>
      {#if open}
        <div
          class="credits-dropdown absolute right-0 top-full z-10 mt-1 max-h-40 w-[min(26rem,calc(100vw-1.5rem))] border border-black/10 bg-white"
          role="dialog"
          aria-label="Sources"
        >
          {#if credits.length === 0}
            <p class="px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-black/30">Source unavailable</p>
          {:else}
            <div class="flex flex-col">
              {#each credits as credit}
                <div class="flex items-center border-b border-black/5 py-2 pl-3 pr-3 last:border-0">
                  <div
                    class="shrink-0 whitespace-nowrap pr-[30px] font-mono text-[0.55rem] uppercase leading-none tracking-widest text-black/40"
                  >{credit.source}</div>
                  <div class="min-w-0 flex-1 leading-none">
                    <a
                      href={credit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={credit.url}
                      class="block min-w-0 truncate text-[0.65rem] leading-none text-black underline underline-offset-2"
                    >{credit.url}</a>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
      {#if !isLive}
        <p class="mb-1 pr-8 font-mono text-[0.55rem] uppercase tracking-widest text-black/30">Why it matters</p>
        <p class="border-l border-black/20 pl-2 text-[0.7rem] italic leading-tight text-black/55">{whyItMatters}</p>
      {/if}
    </div>
    <NewsTags {tags} />
  </div>
</div>
