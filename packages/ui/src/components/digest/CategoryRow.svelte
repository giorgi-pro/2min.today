<script lang="ts">
  import { dragHandle } from 'svelte-dnd-action';
  import CategoryPanel from './CategoryPanel.svelte';
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

  type Props = {
    name: string;
    summary: string[];
    news: NewsItem[];
    index: number;
    minimized?: boolean;
    onMinimize?: () => void;
    onExpand?: () => void;
    reorderable?: boolean;
  };

  const {
    name,
    summary,
    news,
    index,
    minimized = false,
    onMinimize,
    onExpand,
    reorderable = false,
  }: Props = $props();
  let showNews = $state(false);
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  function onMinimizedRowEnter() {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    if (!showNews) hoverTimer = setTimeout(() => { showNews = true; }, 1000);
  }

  function onMinimizedRowLeave() {
    if (hoverTimer) { clearTimeout(hoverTimer); }
    hoverTimer = setTimeout(() => { showNews = false; }, 2000);
  }

  let tooltipVisible = $state(false);
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let tooltipCredits = $state<Credit[]>([]);

  function showCreditTooltip(e: MouseEvent, credits: Credit[]) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    tooltipX = rect.left;
    tooltipY = rect.bottom + 4;
    tooltipCredits = credits;
    tooltipVisible = true;
  }

  function hideCreditTooltip() {
    tooltipVisible = false;
  }

  const MAX_SPEED = 2.5;

  let thumbPosition = $state(0);
  let scrollEl: HTMLElement | undefined = $state();
  let rowEl: HTMLElement | undefined = $state();
  let marqueeFrame: number | null = null;
  let marqueeStartTimer: ReturnType<typeof setTimeout> | null = null;
  let marqueeSpeed = 0;
  let marqueeEaseStart: number | null = null;
  const MARQUEE_EASE_DURATION = 1200;
  let marqueeEnabled = $state(true);
  let pressed = $state(false);
  let scrollable = $state(false);

  $effect(() => {
    if (!scrollEl) return;
    const observer = new ResizeObserver(() => {
      scrollable = (scrollEl as HTMLElement).scrollWidth > (scrollEl as HTMLElement).clientWidth;
    });
    observer.observe(scrollEl);
    return () => observer.disconnect();
  });

  function onScroll(e: Event) {
    const el = e.currentTarget as HTMLElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    const thumbWidth = window.innerWidth * 0.2;
    thumbPosition = ratio * Math.max(0, el.clientWidth - thumbWidth - 1);
  }

  function rowCanMarquee(): boolean {
    const el = scrollEl;
    return Boolean(el && el.scrollWidth > el.clientWidth);
  }

  function onRowMouseMove(e: MouseEvent) {
    if (!marqueeEnabled || !rowEl || !rowCanMarquee()) return;
    const rect = rowEl.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    marqueeSpeed = relX > 0.75 ? (relX - 0.75) * 2 * MAX_SPEED : 0;
  }

  function startMarquee() {
    if (!marqueeEnabled || !scrollEl || !rowCanMarquee()) return;
    stopMarquee();
    marqueeStartTimer = setTimeout(() => {
      marqueeStartTimer = null;
      marqueeEaseStart = null;
      function tick(timestamp: number) {
        if (marqueeEaseStart === null) marqueeEaseStart = timestamp;
        const t = Math.min((timestamp - marqueeEaseStart) / MARQUEE_EASE_DURATION, 1);
        const eased = t * t * t; // cubic ease-in
        (scrollEl as HTMLElement).scrollLeft += marqueeSpeed * eased;
        marqueeFrame = requestAnimationFrame(tick);
      }
      marqueeFrame = requestAnimationFrame(tick);
    }, 2000);
  }

  function stopMarquee() {
    if (marqueeStartTimer != null) {
      clearTimeout(marqueeStartTimer);
      marqueeStartTimer = null;
    }
    if (marqueeFrame != null) {
      cancelAnimationFrame(marqueeFrame);
      marqueeFrame = null;
    }
    marqueeSpeed = 0;
    marqueeEaseStart = null;
  }

  function toggleMarquee(_e: MouseEvent) {
    stopMarquee();
    onMinimize?.();
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
  role={reorderable ? 'group' : undefined}
  aria-label={reorderable ? `${name} category row` : undefined}
>
  {#if minimized}
    <div
      class="flex h-8 items-center"
      role="group"
      onmouseenter={onMinimizedRowEnter}
      onmouseleave={onMinimizedRowLeave}
    >
      {#if reorderable}
        <div
          class="flex h-8 w-5 shrink-0 cursor-grab touch-none select-none items-center justify-center border-r border-black/15"
          use:dragHandle
          aria-label="Drag to reorder {name} category"
        ></div>
      {/if}
      <button
        class="flex h-8 shrink-0 cursor-pointer items-center px-4 font-mono text-[0.6rem] font-black uppercase tracking-widest transition-opacity hover:opacity-70
          {index % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black border-r-2 border-black'}"
        onclick={() => onExpand?.()}
        aria-label="Expand category"
      >{name}</button>
      <div class="relative h-8 min-w-0 flex-1" style="overflow-x: auto; overflow-y: hidden;">
        <div
          class="flex h-full divide-x divide-black/10"
          style:transform={showNews ? 'translateY(0)' : 'translateY(100%)'}
          style:transition={showNews
            ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'transform 0.25s cubic-bezier(0.55, 0, 1, 0.45)'}
        >
          {#each news as item}
            <div class="flex h-full shrink-0 items-center gap-2 px-3" role="group">
              {#if item.isBreaking}
                <span class="dot-pulse block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6347]"></span>
              {/if}
              <span class="font-mono text-[0.65rem] whitespace-nowrap leading-none text-black/70">{item.title}</span>
              <button
                type="button"
                class="cursor-pointer border-0 bg-transparent p-1 font-mono text-[0.75rem] font-bold leading-none text-black/30 hover:text-black/60"
                onmouseenter={(e) => showCreditTooltip(e, item.credits)}
                onmouseleave={hideCreditTooltip}
              >©</button>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <div
      class="grid"
      style="grid-template-columns: 30vh 1fr"
      bind:this={rowEl}
      onmouseenter={startMarquee}
      onmouseleave={stopMarquee}
      onmousemove={onRowMouseMove}
    >
      <CategoryPanel
        {name}
        {summary}
        inverted={index % 2 === 0}
        {pressed}
        {marqueeEnabled}
        reorderHandle={reorderable}
        onclick={toggleMarquee}
      />

      <div class="relative overflow-hidden">
        <div
          class="news-scroll flex h-[30vh] overflow-x-scroll overflow-y-hidden divide-x divide-black/10"
          bind:this={scrollEl}
          onscroll={onScroll}
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

        {#if scrollable}
          <div class="pointer-events-none absolute bottom-[1px] left-[1px] right-0 h-[4px]">
            <div class="absolute top-0 h-full bg-black" style="left: {thumbPosition}px; width: 20vw"></div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if tooltipVisible}
  <div
    class="fixed z-50 max-h-40 w-[min(26rem,calc(100vw-1.5rem))] border border-black/10 bg-white"
    style="left: {tooltipX}px; top: {tooltipY}px;"
    role="tooltip"
    onmouseenter={() => (tooltipVisible = true)}
    onmouseleave={hideCreditTooltip}
  >
    {#if tooltipCredits.length === 0}
      <p class="px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-black/30">Source unavailable</p>
    {:else}
      <div class="flex flex-col">
        {#each tooltipCredits as credit}
          <div class="flex items-center border-b border-black/5 py-2 pl-3 pr-3 last:border-0">
            <div class="shrink-0 whitespace-nowrap pr-[30px] font-mono text-[0.55rem] uppercase leading-none tracking-widest text-black/40">{credit.source}</div>
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
