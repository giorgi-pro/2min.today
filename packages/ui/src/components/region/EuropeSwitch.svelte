<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import europeSvg from './icons/europe.svg?raw';

  interface Props { active?: boolean; onclick?: () => void; }
  const { active = false, onclick }: Props = $props();
</script>

<RegionSwitch {active} {onclick}>
  {#snippet icon()}
    {@html europeSvg}
  {/snippet}
</RegionSwitch>
