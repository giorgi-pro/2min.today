<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    icon: Snippet;
    class?: string;
    active?: boolean;
    onclick?: () => void;
  }

  const { icon, class: className, active = false, onclick }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onclick?.();
    }
  }
</script>

<div
  class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center hover:text-primary {active ? 'text-primary' : 'text-black'} {className ?? ''}"
  onclick={onclick}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-pressed={active}
>
  <span class="block h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-full [&>svg]:max-w-full">
    {@render icon()}
  </span>
</div>
