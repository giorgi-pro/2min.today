<script lang="ts">
  import AfricaSwitch from './region/AfricaSwitch.svelte';
  import AmericasSwitch from './region/AmericasSwitch.svelte';
  import AsiaSwitch from './region/AsiaSwitch.svelte';
  import EuropeSwitch from './region/EuropeSwitch.svelte';
  import GlobalSwitch from './region/GlobalSwitch.svelte';
  import MiddleEastSwitch from './region/MiddleEastSwitch.svelte';
  import USASwitch from './region/USASwitch.svelte';

  import type { Region } from '@2min.today/types';

  interface Props {
    activeRegions?: Set<Region>;
    onRegionToggle?: (r: Region) => void;
    onRegionClear?: () => void;
  }

  const { activeRegions = new Set(), onRegionToggle, onRegionClear }: Props = $props();
</script>

<nav class="flex flex-row items-center gap-2" aria-label="Region">
  <!-- Globe hidden for now (distracting). Kept for future use. Flip to re-enable. -->
  {#if false}
    <div class="mr-2"><GlobalSwitch onclick={onRegionClear} /></div>
  {/if}
  <USASwitch active={activeRegions.has('usa')} onclick={() => onRegionToggle?.('usa')} />
  <EuropeSwitch active={activeRegions.has('europe')} onclick={() => onRegionToggle?.('europe')} />
  <MiddleEastSwitch active={activeRegions.has('middle-east')} onclick={() => onRegionToggle?.('middle-east')} />
  <AmericasSwitch active={activeRegions.has('americas')} onclick={() => onRegionToggle?.('americas')} />
  <AsiaSwitch active={activeRegions.has('asia')} onclick={() => onRegionToggle?.('asia')} />
  <AfricaSwitch active={activeRegions.has('africa')} onclick={() => onRegionToggle?.('africa')} />
</nav>
