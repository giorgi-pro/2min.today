<script lang="ts">
  import { mockData } from '$lib/mock-data'
  import type { DigestCard } from './+page.server'

  type Category = {
    name: string
    summary: string[]
    news: {
      title: string
      bullets: string[]
      whyItMatters: string
      source: string
      isBreaking: boolean
    }[]
  }

  const { data } = $props<{ data: { digest: Partial<Record<string, DigestCard[]>> } }>()

  function liveToCategories(digest: Partial<Record<string, DigestCard[]>>): Category[] {
    const bucketOrder = ['World', 'Business', 'Tech', 'Science', 'Health', 'Emerging']
    return bucketOrder
      .filter(b => digest[b]?.length)
      .map(b => ({
        name: b,
        summary: (digest[b] ?? []).slice(0, 5).map(c => c.headline),
        news: (digest[b] ?? []).map(c => ({
          title: c.headline,
          bullets: c.bullets,
          whyItMatters: c.whyItMatters,
          source: c.categoryLine ?? b,
          isBreaking: false,
        })),
      }))
  }

  function mockToCategories(): Category[] {
    return mockData.map(c => ({
      name: c.name,
      summary: c.summary,
      news: c.news.map(n => ({
        title: n.title,
        bullets: n.content
          .split('. ')
          .map(s => s.replace(/\.$/, '').trim())
          .filter(Boolean)
          .slice(0, 3),
        whyItMatters: n.whyItMatters,
        source: n.source,
        isBreaking: n.isBreaking,
      })),
    }))
  }

  const categories: Category[] = $derived(
    data?.digest && Object.keys(data.digest).length > 0
      ? liveToCategories(data.digest)
      : mockToCategories()
  )

  const MAX_BUCKETS = 8
  let thumbPositions: number[] = $state(new Array(MAX_BUCKETS).fill(0))
  let scrollEls: HTMLElement[] = []
  let marqueeFrames: (number | null)[] = new Array(MAX_BUCKETS).fill(null)
  let marqueeSpeeds: number[] = new Array(MAX_BUCKETS).fill(0)
  let marqueeEnabled: boolean[] = $state(new Array(MAX_BUCKETS).fill(true))
  let pressed: boolean[] = $state(new Array(MAX_BUCKETS).fill(false))

  const MAX_SPEED = 2.5

  function onScroll(e: Event, i: number) {
    const el = e.currentTarget as HTMLElement
    const maxScroll = el.scrollWidth - el.clientWidth
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0
    const thumbWidth = window.innerWidth * 0.2
    const trackWidth = el.clientWidth
    thumbPositions[i] = ratio * Math.max(0, trackWidth - thumbWidth - 1)
  }

  let categoryEls: HTMLElement[] = []

  function onCategoryMouseMove(e: MouseEvent, i: number) {
    if (!marqueeEnabled[i]) return
    const rect = categoryEls[i].getBoundingClientRect()
    const offset = (e.clientX - rect.left) / rect.width
    marqueeSpeeds[i] = (offset - 0.5) * 2 * MAX_SPEED
  }

  function startMarquee(i: number) {
    if (!marqueeEnabled[i]) return
    const el = scrollEls[i]
    if (!el) return

    function tick() {
      el.scrollLeft += marqueeSpeeds[i]
      marqueeFrames[i] = requestAnimationFrame(tick)
    }

    marqueeFrames[i] = requestAnimationFrame(tick)
  }

  function stopMarquee(i: number) {
    if (marqueeFrames[i] != null) {
      cancelAnimationFrame(marqueeFrames[i] as number)
      marqueeFrames[i] = null
    }
    marqueeSpeeds[i] = 0
  }

  function toggleMarquee(e: MouseEvent, i: number) {
    marqueeEnabled[i] = !marqueeEnabled[i]
    if (marqueeEnabled[i]) {
      onCategoryMouseMove(e, i)
      startMarquee(i)
    } else {
      stopMarquee(i)
    }

    pressed[i] = true
    setTimeout(() => (pressed[i] = false), 150)
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
  {#each categories as category, i}
    <div class="grid border-b-2 border-black" style="grid-template-columns: 30vh 1fr">

      <div
        role="presentation"
        class="flex h-[30vh] flex-col justify-between transition-transform duration-150 ease-out 
          {i % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black border-r-2 border-black'}
          {marqueeEnabled[i] ? 'cursor-grab' : 'cursor-pointer'}"
        style:transform={pressed[i] ? 'translate(-1px, 1px)' : ''}
        bind:this={categoryEls[i]}
        onmouseenter={() => startMarquee(i)}
        onmouseleave={() => stopMarquee(i)}
        onmousemove={e => onCategoryMouseMove(e, i)}
        onclick={e => toggleMarquee(e, i)}
      >
        <span class="whitespace-nowrap text-xl font-black uppercase leading-none tracking-tight m-6">
          {category.name}
        </span>
        <ul class="space-y-1 text-right m-3">
          {#each category.summary as line}
            <li class="text-[0.55rem] leading-tight opacity-60">{line}.</li>
          {/each}
        </ul>
      </div>

      <div class="relative overflow-hidden">

        <div
          class="news-scroll flex h-[30vh] overflow-x-scroll overflow-y-hidden divide-x divide-black/10"
          bind:this={scrollEls[i]}
          onscroll={e => onScroll(e, i)}
        >
          {#each category.news as item}
            <div class="news-tile flex h-full flex-col p-5">

              <div class="mb-3 flex w-0 min-w-full flex-none items-center justify-between gap-4">
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

              <h2 class="mb-3 flex-none text-lg font-bold leading-snug tracking-tight text-black">
                {item.title}
              </h2>

              <ul class="min-h-0 w-0 min-w-full flex-1 space-y-1.5 overflow-hidden">
                {#each item.bullets as bullet}
                  <li class="flex gap-2 text-[0.8rem] leading-snug text-black">
                    <span class="mt-[0.35rem] block h-[3px] w-[3px] shrink-0 bg-black"></span>
                    <span>{bullet}</span>
                  </li>
                {/each}
              </ul>

              <div class="mt-3 w-0 min-w-full flex-none">
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

        <div class="pointer-events-none absolute bottom-[1px] left-[1px] right-0 h-[4px]">
          <div
            class="absolute top-0 h-full bg-black"
            style="left: {thumbPositions[i]}px; width: 20vw"
          ></div>
        </div>

      </div>

    </div>
  {/each}
</div>
