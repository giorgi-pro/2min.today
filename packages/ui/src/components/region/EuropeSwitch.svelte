<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import europeSvg from './icons/europe.svg?raw';
</script>

<RegionSwitch>
  {#snippet icon()}
    {@html europeSvg}
  {/snippet}
</RegionSwitch>
