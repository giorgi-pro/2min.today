<script lang="ts">
  import globeSvg from './icons/globe.svg?raw';

  interface Props {
    active?: boolean;
  }

  const { active = false }: Props = $props();

  let hovered = $state(false);
</script>

<div
  class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-black"
  style={(active || hovered) ? 'outline: 2px solid #FF6347; outline-offset: 0px;' : ''}
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
  role="button"
  tabindex="0"
  aria-pressed={active}
>
  <span class="block h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-full [&>svg]:max-w-full">
    {@html globeSvg}
  </span>
</div>
