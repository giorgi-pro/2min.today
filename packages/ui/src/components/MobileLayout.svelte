<script lang="ts">
  import GlobalSearch from './GlobalSearch.svelte';
  import Logo from './Logo.svelte';
  import Menu from './Menu.svelte';

  type Region = 'world' | 'europe' | 'americas' | 'middle-east' | 'usa';

  interface Props {
    searchQuery?: string;
    activeRegions?: Set<Region>;
    onRegionToggle?: (r: Region) => void;
    onRegionClear?: () => void;
    children: import('svelte').Snippet;
  }

  let {
    searchQuery = $bindable(''),
    activeRegions = new Set(),
    onRegionToggle,
    onRegionClear,
    children,
  }: Props = $props();
</script>

<header class="sticky top-0 z-50 border-b-2 border-black bg-white">
  <div class="flex h-14 w-full items-center justify-between px-6">
    <Logo />
    <Menu {activeRegions} {onRegionToggle} {onRegionClear} />
  </div>
  <div class="border-t-2 border-black px-6 py-3">
    <GlobalSearch bind:value={searchQuery} class="max-w-full" />
  </div>
</header>

{@render children()}
