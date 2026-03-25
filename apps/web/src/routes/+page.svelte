<script lang="ts">
  import { mockData } from '$lib/mock-data'

  function toBullets(text: string): string[] {
    return text
      .split('. ')
      .map(s => s.replace(/\.$/, '').trim())
      .filter(Boolean)
      .slice(0, 3)
  }
</script>

<svelte:head>
  <title>2min.today</title>
  <meta
    name="description"
    content="2min.today is a daily, informationally dense Global Digest that summarizes the world's most significant news into a precise two-minute read."
  />
</svelte:head>

<div class="border-t-2 border-black">
  {#each mockData as category, i}
    <div class="grid border-b-2 border-black" style="grid-template-columns: 180px 1fr">

      <!-- Left: category sidebar -->
      <div
        class="flex h-[30vh] flex-col p-6
          {i % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black border-r-2 border-black'}"
      >
        <span class="text-3xl font-black uppercase leading-none tracking-tight">
          {category.name}
        </span>
      </div>

      <!-- Right: horizontally scrolling news tiles -->
      <div class="news-scroll flex h-[30vh] divide-x divide-black/10">
        {#each category.news as item}
          <div class="flex h-full min-w-[30vh] max-w-[60vh] shrink-0 flex-col p-5">

            <!-- Badge + source -->
            <div class="mb-3 flex flex-none items-center justify-between gap-4">
              {#if item.isBreaking}
                <span class="bg-black px-2 py-0.5 font-mono text-[0.55rem] font-medium uppercase tracking-widest text-white">
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

            <!-- Title -->
            <h2 class="mb-3 flex-none text-lg font-bold leading-snug tracking-tight text-black">
              {item.title}
            </h2>

            <!-- Bullets: takes remaining space, clips overflow -->
            <ul class="min-h-0 flex-1 space-y-1.5 overflow-hidden">
              {#each toBullets(item.content) as bullet}
                <li class="flex gap-2 text-[0.8rem] leading-snug text-black">
                  <span class="mt-[0.35rem] block h-[3px] w-[3px] shrink-0 bg-black"></span>
                  <span>{bullet}</span>
                </li>
              {/each}
            </ul>

            <!-- Why it matters: pinned to bottom -->
            <div class="mt-3 flex-none">
              <div class="mb-2 border-t border-black/15"></div>
              <p class="mb-1 font-mono text-[0.55rem] uppercase tracking-widest text-black/30">
                Why it matters
              </p>
              <p class="border-l border-black/20 pl-2 text-[0.7rem] italic leading-tight text-black/55">
                {item.whyItMatters}
              </p>
            </div>

          </div>
        {/each}
      </div>

    </div>
  {/each}
</div>
