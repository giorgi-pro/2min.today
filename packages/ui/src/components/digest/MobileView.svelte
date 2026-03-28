<script lang="ts">
  import MobileCategoryNews from './MobileCategoryNews.svelte';
  import type { CategoryEntry } from '@2min.today/types';

  interface Props {
    categories: CategoryEntry[];
  }

  const { categories }: Props = $props();

  let expandedBucket = $state<string | null>(null);

  function toggle(bucket: string) {
    expandedBucket = expandedBucket === bucket ? null : bucket;
  }
</script>

<div class="flex flex-col">
  {#each categories as { bucket, index, summary, news } (bucket)}
    <div class="border-b-2 border-black">
      <button
        type="button"
        class="sticky top-14 z-10 flex h-[30vh] w-full flex-col justify-between border-0 p-0 text-left
          {index % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black border-b border-black'}"
        onclick={() => toggle(bucket)}
        aria-expanded={expandedBucket === bucket}
      >
        <span class="m-6 text-xl font-black uppercase leading-none tracking-tight">{bucket}</span>
        <ul class="summary-text m-3 space-y-1 text-right">
          {#each summary as line (line)}
            <li>{line}.</li>
          {/each}
        </ul>
      </button>

      <div
        class="overflow-hidden transition-[max-height] duration-500 ease-out"
        style="max-height: {expandedBucket === bucket ? '9999px' : '0'};"
      >
        <MobileCategoryNews {news} />
      </div>
    </div>
  {/each}
</div>
