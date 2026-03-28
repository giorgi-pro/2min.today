<script lang="ts">
  import GlobalSearch from '../components/GlobalSearch.svelte';
  import Logo from '../components/Logo.svelte';
  import Menu from '../components/Menu.svelte';
  import type { ShellLayoutProps } from '../types/shell-layout';

  let {
    searchQuery = $bindable(''),
    activeRegions = new Set(),
    onRegionToggle,
    onRegionClear,
    children,
  }: ShellLayoutProps = $props();

  let scrolled = $state(false);
  let searchFocused = $state(false);

  const searchExpanded = $derived(!scrolled || searchFocused);

  function onWindowScroll() {
    scrolled = window.scrollY > 10;
  }
</script>

<svelte:window onscroll={onWindowScroll} />

<header class="sticky top-0 z-50 border-b-2 border-black bg-white">
  <div class="flex h-14 w-full items-center justify-between px-6">
    <Logo />
    <Menu {activeRegions} {onRegionToggle} {onRegionClear} />
  </div>
  <div
    class="overflow-hidden border-t-2 border-black transition-[padding] duration-300 ease-out"
    style="padding-top: {searchExpanded ? '0.75rem' : '0.1rem'}; padding-bottom: {searchExpanded ? '0.75rem' : '0.1rem'};"
  >
    <div class="px-6">
      <GlobalSearch
        bind:value={searchQuery}
        class="max-w-full"
        onfocus={() => (searchFocused = true)}
        onblur={() => (searchFocused = false)}
      />
    </div>
  </div>
</header>

{@render children()}
