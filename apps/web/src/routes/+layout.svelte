<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import Header from '@2min.today/ui/components/Header.svelte'
  import MobileLayout from '@2min.today/ui/components/MobileLayout.svelte'
  import Footer from '@2min.today/ui/components/Footer.svelte'
  import BottomSection from '@2min.today/ui/components/BottomSection.svelte'
  import { searchQuery, activeRegions } from '$lib/digest-filter'
  import type { Region } from '$lib/types/digest'

  let { data, children } = $props()

  let isMobile = $state(false)

  onMount(() => {
    const mq = window.matchMedia('(max-width: 576px)')
    isMobile = mq.matches
    const handler = (e: MediaQueryListEvent) => { isMobile = e.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  })
</script>

<div class="min-h-screen flex flex-col bg-white">
  {#if isMobile}
    <MobileLayout
      bind:searchQuery={$searchQuery}
      activeRegions={$activeRegions}
      onRegionToggle={(r: Region) => activeRegions.toggle(r)}
      onRegionClear={() => activeRegions.clear()}
    >
      <main class="flex-1">
        {@render children()}
      </main>
      <BottomSection newsSourcesCount={data.newsSourcesCount} />
      <Footer />
    </MobileLayout>
  {:else}
    <Header
      bind:searchQuery={$searchQuery}
      activeRegions={$activeRegions}
      onRegionToggle={(r: Region) => activeRegions.toggle(r)}
      onRegionClear={() => activeRegions.clear()}
    />
    <main class="flex-1">
      {@render children()}
    </main>
    <BottomSection newsSourcesCount={data.newsSourcesCount} />
    <Footer />
  {/if}
</div>
