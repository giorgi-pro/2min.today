<script lang="ts">
  import NewsTags from './NewsTags.svelte';
  import type { NewsItem } from '@2min.today/types';

  const { title, bullets, whyItMatters, credits, isBreaking, isLive, tags }: NewsItem = $props();

  let open = $state(false);
</script>

<div
  class="w-full shrink-0 snap-start snap-always border-b border-black/10 px-4 py-4 {isLive ? 'bg-white' : ''}"
  role="presentation"
>
  {#if isLive}
    <span class="mb-2 block font-mono text-[0.55rem] font-bold uppercase tracking-widest text-[#637588]">Live</span>
  {:else if isBreaking}
    <span class="dot-pulse mb-2 block h-1.5 w-1.5 rounded-full bg-[#FF6347]"></span>
  {/if}

  <div class={isLive ? 'border border-black/15 bg-[#F0F2F4] p-3' : ''}>
    <h2 class="mb-3 text-lg font-bold leading-snug tracking-tight {isLive ? 'text-[#181c20]' : 'text-black'}">{title}</h2>
    <ul class="space-y-2">
      {#each bullets as bullet (bullet)}
        <li class="flex gap-2 text-[0.8rem] leading-snug {isLive ? 'text-[#3d4754]' : 'text-black'}">
          <span class="mt-[0.35rem] block h-[3px] w-[3px] shrink-0 {isLive ? 'bg-[#637588]' : 'bg-black'}"></span>
          <span>{bullet}</span>
        </li>
      {/each}
    </ul>
  </div>

  <div class="mt-4">
    <div class="mb-3 border-t border-black/15"></div>

    <div class="relative {isLive ? 'mb-3' : ''}">
      <button
        type="button"
        class="absolute right-0 top-0 z-[1] cursor-pointer border-0 bg-transparent p-0 font-mono text-[1rem] font-normal leading-none text-black/30 transition-colors"
        onclick={() => (open = !open)}
        aria-label="Toggle sources"
        aria-expanded={open}
      >©</button>

      {#if open}
        <div
          class="credits-dropdown mb-2 max-h-40 border border-black/10 bg-white"
          role="presentation"
          aria-label="Sources"
        >
          {#if credits.length === 0}
            <p class="px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-black/30">Source unavailable</p>
          {:else}
            <div class="flex flex-col">
              {#each credits as credit (credit.url)}
                <div class="flex items-center border-b border-black/5 py-2 pl-3 pr-3 last:border-0">
                  <div class="shrink-0 whitespace-nowrap pr-6 font-mono text-[0.55rem] uppercase leading-none tracking-widest text-black/40">{credit.source}</div>
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
