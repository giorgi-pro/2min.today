<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import middleEastSvg from './icons/middle-east.svg?raw';

  interface Props { active?: boolean; onclick?: () => void; }
  const { active = false, onclick }: Props = $props();
</script>

<RegionSwitch {active} {onclick}>
  {#snippet icon()}
    {@html middleEastSvg}
  {/snippet}
</RegionSwitch>
