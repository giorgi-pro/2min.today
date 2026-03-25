<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import usaSvg from './icons/usa.svg?raw';
</script>

<RegionSwitch>
  {#snippet icon()}
    {@html usaSvg}
  {/snippet}
</RegionSwitch>
