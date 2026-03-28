<script lang="ts">
  import GlobalSearch from './GlobalSearch.svelte';
  import Logo from './Logo.svelte';
  import Menu from './Menu.svelte';
  import type { Region } from '@2min.today/types';

  interface Props {
    searchQuery?: string;
    activeRegions?: Set<Region>;
    onRegionToggle?: (r: Region) => void;
    onRegionClear?: () => void;
  }

  let {
    searchQuery = $bindable(''),
    activeRegions = new Set(),
    onRegionToggle,
    onRegionClear,
  }: Props = $props();
</script>

<header class="sticky top-0 z-50 border-b-2 border-black bg-white">
  <div
    class="grid h-14 w-full grid-cols-[auto,minmax(0,1fr),auto] items-center gap-4 px-6 md:h-16 md:gap-5 md:px-8"
  >
    <Logo />
    <div class="flex min-w-0 justify-center px-2 md:px-4">
      <GlobalSearch bind:value={searchQuery} />
    </div>
    <Menu {activeRegions} {onRegionToggle} {onRegionClear} />
  </div>
</header>
