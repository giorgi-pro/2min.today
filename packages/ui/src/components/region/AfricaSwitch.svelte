<script lang="ts">
  import RegionSwitch from './RegionSwitch.svelte';
  import africaSvg from './icons/africa.svg?raw';

  interface Props { active?: boolean; onclick?: () => void; }
  const { active = false, onclick }: Props = $props();
</script>

<RegionSwitch {active} {onclick}>
  {#snippet icon()}
    <span class="flex h-full w-full items-center justify-center">
      <span class="block h-[75%] w-[75%] [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-full [&>svg]:max-w-full">
        {@html africaSvg}
      </span>
    </span>
  {/snippet}
</RegionSwitch>
