<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import africaSvg from './icons/africa.svg?raw';

  interface Props { active?: boolean; onclick?: () => void; }
  const { active = false, onclick }: Props = $props();
</script>

<RegionSwitch {active} {onclick}>
  {#snippet icon()}
    {@html africaSvg}
  {/snippet}
</RegionSwitch>
