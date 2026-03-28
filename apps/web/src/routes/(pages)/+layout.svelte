<script lang="ts">
import BottomSection from '@ui/components/BottomSection.svelte'
import Footer from '@ui/components/Footer.svelte'
import DesktopLayout from '@ui/layout/DesktopLayout.svelte'
import MobileLayout from '@ui/layout/MobileLayout.svelte'
import { activeRegions, searchQuery } from '@utils/digest-filter'
import type { Region } from '../../../../../packages/types/digest.js'
import '@ui/styles/index.css'
import { MediaQuery } from 'svelte/reactivity'

const { data, children } = $props()

const isMobile = new MediaQuery('max-width: 576px', false)
const Layout = $derived(isMobile.current ? MobileLayout : DesktopLayout)
</script>

<div class="min-h-screen flex flex-col bg-white">
  <Layout
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
  </Layout>
</div>
