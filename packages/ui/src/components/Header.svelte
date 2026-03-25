<script lang="ts">
  import Logo from './Logo.svelte';
  import Menu from './Menu.svelte';
</script>

<header class="sticky top-0 z-50 border-b-2 border-black bg-white">
  <div class="flex h-14 items-center gap-4 px-6 md:h-16 md:gap-5 md:px-8">
    <Logo />
    <Menu />
  </div>
</header>
