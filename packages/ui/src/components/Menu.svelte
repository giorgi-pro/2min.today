<script lang="ts">
  import AmericasSwitch from './region/AmericasSwitch.svelte';
  import EuropeSwitch from './region/EuropeSwitch.svelte';
  import GlobalSwitch from './region/GlobalSwitch.svelte';
  import MiddleEastSwitch from './region/MiddleEastSwitch.svelte';
  import USASwitch from './region/USASwitch.svelte';

  type Region = 'global' | 'europe' | 'americas' | 'middle-east' | 'usa';

  interface Props {
    activeRegion?: Region;
    onRegionChange?: (r: Region) => void;
  }

  const { activeRegion = 'global', onRegionChange }: Props = $props();
</script>

<nav class="flex flex-row items-center gap-2" aria-label="Region">
  <GlobalSwitch onclick={() => onRegionChange?.('global')} />
  <EuropeSwitch active={activeRegion === 'europe'} onclick={() => onRegionChange?.('europe')} />
  <AmericasSwitch active={activeRegion === 'americas'} onclick={() => onRegionChange?.('americas')} />
  <MiddleEastSwitch active={activeRegion === 'middle-east'} onclick={() => onRegionChange?.('middle-east')} />
  <USASwitch active={activeRegion === 'usa'} onclick={() => onRegionChange?.('usa')} />
</nav>
