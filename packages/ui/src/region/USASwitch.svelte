<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import usaSvg from './icons/usa.svg?raw';

  interface Props { active?: boolean; onclick?: () => void; }
  const { active = false, onclick }: Props = $props();
</script>

<RegionSwitch {active} {onclick}>
  {#snippet icon()}
    {@html usaSvg}
  {/snippet}
</RegionSwitch>
