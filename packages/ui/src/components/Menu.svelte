<script lang="ts">
  import AmericasSwitch from './region/AmericasSwitch.svelte';
  import EuropeSwitch from './region/EuropeSwitch.svelte';
  import GlobalSwitch from './region/GlobalSwitch.svelte';
  import MiddleEastSwitch from './region/MiddleEastSwitch.svelte';
  import USASwitch from './region/USASwitch.svelte';

  type Region = 'world' | 'europe' | 'americas' | 'middle-east' | 'usa';

  interface Props {
    activeRegions?: Set<Region>;
    onRegionToggle?: (r: Region) => void;
    onRegionClear?: () => void;
  }

  const { activeRegions = new Set(), onRegionToggle, onRegionClear }: Props = $props();
</script>

<nav class="flex flex-row items-center gap-2" aria-label="Region">
  <div class="mr-2"><GlobalSwitch onclick={onRegionClear} /></div>
  <EuropeSwitch active={activeRegions.has('europe')} onclick={() => onRegionToggle?.('europe')} />
  <AmericasSwitch active={activeRegions.has('americas')} onclick={() => onRegionToggle?.('americas')} />
  <MiddleEastSwitch active={activeRegions.has('middle-east')} onclick={() => onRegionToggle?.('middle-east')} />
  <USASwitch active={activeRegions.has('usa')} onclick={() => onRegionToggle?.('usa')} />
</nav>
