<script lang="ts">
  import '../app.css'
  import Header from '@2min.today/ui/components/Header.svelte'
  import Footer from '@2min.today/ui/components/Footer.svelte'
  import BottomSection from '@2min.today/ui/components/BottomSection.svelte'
  import { searchQuery } from '$lib/digest-filter'

  let { children } = $props()
</script>

<div class="min-h-screen flex flex-col bg-white">
  <Header bind:searchQuery={$searchQuery} searchPlaceholder="SEARCH DIGEST" />
  <main class="flex-1">
    {@render children()}
  </main>
  <BottomSection />
  <Footer />
</div>
