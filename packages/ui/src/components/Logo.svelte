<script lang="ts">
  interface Props {
    href?: string;
  }

  let { href = '/' }: Props = $props();
</script>

<a href={href} class="shrink-0 font-sans text-lg font-black tracking-tight text-black md:text-xl">
  2min<span class="text-primary">.</span>&#x20;today
</a>
