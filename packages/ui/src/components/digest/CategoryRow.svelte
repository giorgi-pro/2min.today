<script lang="ts">
  import CategoryPanel from './CategoryPanel.svelte';
  import NewsCard from './NewsCard.svelte';

  type NewsItem = {
    title: string;
    bullets: string[];
    whyItMatters: string;
    source: string;
    isBreaking: boolean;
    tags: string[];
  };

  type Props = {
    name: string;
    summary: string[];
    news: NewsItem[];
    index: number;
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
  };

  const { name, summary, news, index, selectedTags, onToggleTag }: Props = $props();

  const MAX_SPEED = 2.5;

  let thumbPosition = $state(0);
  let scrollEl: HTMLElement | undefined = $state();
  let categoryEl: HTMLElement | undefined = $state();
  let marqueeFrame: number | null = null;
  let marqueeSpeed = 0;
  let marqueeEnabled = $state(true);
  let pressed = $state(false);

  function onScroll(e: Event) {
    const el = e.currentTarget as HTMLElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    const thumbWidth = window.innerWidth * 0.2;
    thumbPosition = ratio * Math.max(0, el.clientWidth - thumbWidth - 1);
  }

  function onCategoryMouseMove(e: MouseEvent) {
    if (!marqueeEnabled || !categoryEl) return;
    const rect = categoryEl.getBoundingClientRect();
    marqueeSpeed = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * MAX_SPEED;
  }

  function startMarquee() {
    if (!marqueeEnabled || !scrollEl) return;
    function tick() {
      (scrollEl as HTMLElement).scrollLeft += marqueeSpeed;
      marqueeFrame = requestAnimationFrame(tick);
    }
    marqueeFrame = requestAnimationFrame(tick);
  }

  function stopMarquee() {
    if (marqueeFrame != null) {
      cancelAnimationFrame(marqueeFrame);
      marqueeFrame = null;
    }
    marqueeSpeed = 0;
  }

  function toggleMarquee(e: MouseEvent) {
    marqueeEnabled = !marqueeEnabled;
    if (marqueeEnabled) {
      onCategoryMouseMove(e);
      startMarquee();
    } else {
      stopMarquee();
    }
    pressed = true;
    setTimeout(() => (pressed = false), 150);
  }
</script>

<div class="grid border-b-2 border-black" style="grid-template-columns: 30vh 1fr">
  <CategoryPanel
    {name}
    {summary}
    inverted={index % 2 === 0}
    {pressed}
    {marqueeEnabled}
    bind:el={categoryEl}
    onmouseenter={startMarquee}
    onmouseleave={stopMarquee}
    onmousemove={onCategoryMouseMove}
    onclick={toggleMarquee}
  />

  <div class="relative overflow-hidden">
    <div
      class="news-scroll flex h-[30vh] overflow-x-scroll overflow-y-hidden divide-x divide-black/10"
      bind:this={scrollEl}
      onscroll={onScroll}
    >
      {#each news as item}
        <NewsCard
          title={item.title}
          bullets={item.bullets}
          whyItMatters={item.whyItMatters}
          source={item.source}
          isBreaking={item.isBreaking}
          tags={item.tags}
          {selectedTags}
          {onToggleTag}
        />
      {/each}
    </div>

    <div class="pointer-events-none absolute bottom-[1px] left-[1px] right-0 h-[4px]">
      <div class="absolute top-0 h-full bg-black" style="left: {thumbPosition}px; width: 20vw"></div>
    </div>
  </div>
</div>
