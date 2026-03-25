<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import globeSvg from './icons/globe.svg?raw';

  interface Props {
    active?: boolean;
  }

  const { active = false }: Props = $props();
</script>

<RegionSwitch {active}>
  {#snippet icon()}
    {@html globeSvg}
  {/snippet}
</RegionSwitch>
