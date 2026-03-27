<script lang="ts">
  import Header from '../components/Header.svelte';
  import type { ShellLayoutProps } from './shell-layout';

  let {
    searchQuery = $bindable(''),
    activeRegions = new Set(),
    onRegionToggle,
    onRegionClear,
    children,
  }: ShellLayoutProps = $props();
</script>

<Header bind:searchQuery {activeRegions} {onRegionToggle} {onRegionClear} />

{@render children()}
