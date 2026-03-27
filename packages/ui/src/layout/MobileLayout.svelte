<script lang="ts">
  import GlobalSearch from '../components/GlobalSearch.svelte';
  import Logo from '../components/Logo.svelte';
  import Menu from '../components/Menu.svelte';
  import type { ShellLayoutProps } from './shell-layout';

  let {
    searchQuery = $bindable(''),
    activeRegions = new Set(),
    onRegionToggle,
    onRegionClear,
    children,
  }: ShellLayoutProps = $props();
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
