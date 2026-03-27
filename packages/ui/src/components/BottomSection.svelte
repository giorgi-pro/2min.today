<script lang="ts">
  import { onMount } from 'svelte';
  import BottomTile from './BottomTile.svelte';
  import TimerTile from './TimerTile.svelte';
  import TimeTile from './TimeTile.svelte';

  const { newsSourcesCount }: { newsSourcesCount: number } = $props();

  let utc = $state(false);

  let currentVisitors = $state('0002');

  onMount(() => {
    const n = 2 + Math.floor(Math.random() * 3);
    currentVisitors = String(n).padStart(4, '0');
  });
</script>

<section class="border-t-2 border-black px-4 py-4 md:px-4">
  <div class="flex flex-wrap gap-4">
    <BottomTile header="Current Visitors" content={currentVisitors} />
    <TimerTile {utc} ontoggle={() => (utc = !utc)} />
    <BottomTile header="News Sources" content={String(newsSourcesCount)} />
    <TimeTile header="Last Digest" time="06:00" {utc} ontoggle={() => (utc = !utc)} />
  </div>
</section>
