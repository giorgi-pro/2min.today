<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import americasSvg from './icons/americas.svg?raw';

  interface Props { active?: boolean; onclick?: () => void; }
  const { active = false, onclick }: Props = $props();
</script>

<RegionSwitch {active} {onclick}>
  {#snippet icon()}
    {@html americasSvg}
  {/snippet}
</RegionSwitch>
