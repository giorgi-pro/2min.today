<script lang="ts">
  import BottomTile from './BottomTile.svelte';
  import TimerTile from './TimerTile.svelte';
  import TimeTile from './TimeTile.svelte';

  let utc = $state(false);
</script>

<section class="border-t-2 border-black px-4 py-4 md:px-4">
  <div class="flex flex-wrap gap-4">
    <BottomTile header="Current Visitors" content="1,482" />
    <TimerTile {utc} ontoggle={() => (utc = !utc)} />
    <BottomTile header="News Sources" content="38" />
    <TimeTile header="Last Digest" time="06:00" {utc} ontoggle={() => (utc = !utc)} />
  </div>
</section>
