<script lang="ts">
  import '../app.css'
  import Header from '@2min.today/ui/components/Header.svelte'
  import Footer from '@2min.today/ui/components/Footer.svelte'

  let { children } = $props()
</script>

<div class="min-h-screen flex flex-col bg-white">
  <Header />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>
