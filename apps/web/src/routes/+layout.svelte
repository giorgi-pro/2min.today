<script lang="ts">
  import '../app.css'
  import Header from '@2min.today/ui/components/Header.svelte'
  import Footer from '@2min.today/ui/components/Footer.svelte'
  import BottomSection from '@2min.today/ui/components/BottomSection.svelte'
  import { searchQuery, activeRegion } from '$lib/digest-filter'
  import type { Region } from '$lib/types/digest'

  let { children } = $props()

  function handleRegionChange(r: Region) {
    activeRegion.set(r)
  }
</script>

<div class="min-h-screen flex flex-col bg-white">
  <Header
    bind:searchQuery={$searchQuery}
    activeRegion={$activeRegion}
    onRegionChange={handleRegionChange}
  />
  <main class="flex-1">
    {@render children()}
  </main>
  <BottomSection />
  <Footer />
</div>
