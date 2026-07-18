<script lang="ts">
  import globeSvg from './icons/globe.svg?raw';

  interface Props {
    onclick?: () => void;
  }

  const { onclick }: Props = $props();
</script>

<div
  class="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-black transition-colors hover:text-black/60"
  {onclick}
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onclick?.()}
  role="button"
  tabindex="0"
>
  <span class="signal-ring" aria-hidden="true"></span>
  <span class="signal-ring signal-ring--b" aria-hidden="true"></span>
  <span class="signal-ring signal-ring--c" aria-hidden="true"></span>
  <span
    class="relative z-[1] block h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-full [&>svg]:max-w-full"
  >
    {@html globeSvg}
  </span>
</div>
