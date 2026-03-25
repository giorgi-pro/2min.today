<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import middleEastSvg from './icons/middle-east.svg?raw';
</script>

<RegionSwitch>
  {#snippet icon()}
    {@html middleEastSvg}
  {/snippet}
</RegionSwitch>
