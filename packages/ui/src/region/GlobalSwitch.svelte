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

<style>
  .signal-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(255, 99, 71, 0.55);
    pointer-events: none;
    animation: radio-wave 2.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
    will-change: transform, opacity;
  }

  .signal-ring--b {
    animation-delay: -0.7s;
  }

  .signal-ring--c {
    animation-delay: -1.4s;
  }

  @keyframes radio-wave {
    0% {
      transform: scale(1);
      opacity: 0.55;
    }
    70% {
      opacity: 0.12;
    }
    100% {
      transform: scale(2.35);
      opacity: 0;
    }
  }
</style>
