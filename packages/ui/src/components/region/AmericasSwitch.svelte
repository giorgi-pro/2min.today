<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import americasSvg from './icons/americas.svg?raw';
</script>

<RegionSwitch>
  {#snippet icon()}
    {@html americasSvg}
  {/snippet}
</RegionSwitch>
