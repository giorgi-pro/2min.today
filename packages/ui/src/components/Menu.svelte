<script lang="ts">
  import AmericasSwitch from './region/AmericasSwitch.svelte';
  import EuropeSwitch from './region/EuropeSwitch.svelte';
  import GlobalSwitch from './region/GlobalSwitch.svelte';
  import MiddleEastSwitch from './region/MiddleEastSwitch.svelte';
  import USASwitch from './region/USASwitch.svelte';
</script>

<nav class="flex flex-row items-center gap-2" aria-label="Region">
  <GlobalSwitch />
  <EuropeSwitch />
  <AmericasSwitch />
  <MiddleEastSwitch />
  <USASwitch />
</nav>
