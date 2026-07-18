<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import asiaSvg from './icons/asia.svg?raw';

  interface Props { active?: boolean; onclick?: () => void; }
  const { active = false, onclick }: Props = $props();
</script>

<RegionSwitch {active} {onclick}>
  {#snippet icon()}
    {@html asiaSvg}
  {/snippet}
</RegionSwitch>
