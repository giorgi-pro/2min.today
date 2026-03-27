<script lang="ts">
  import { dragHandle } from 'svelte-dnd-action';

  function optionalDragHandle(node: HTMLElement, enabled: boolean) {
    let destroyDh: (() => void) | undefined;
    function apply(next: boolean) {
      destroyDh?.();
      destroyDh = undefined;
      if (next) {
        const { destroy } = dragHandle(node);
        destroyDh = destroy;
      }
    }
    apply(enabled);
    return {
      update(next: boolean) {
        apply(next);
      },
      destroy() {
        destroyDh?.();
      },
    };
  }

  type Props = {
    name: string;
    summary: string[];
    inverted: boolean;
    pressed: boolean;
    marqueeEnabled: boolean;
    onclick: (e: MouseEvent) => void;
    reorderHandle?: boolean;
  };

  let {
    name,
    summary,
    inverted,
    pressed,
    marqueeEnabled,
    onclick,
    reorderHandle = false,
  }: Props = $props();
</script>

<div
  role="presentation"
  use:optionalDragHandle={reorderHandle}
  aria-label={reorderHandle ? `Drag to reorder ${name} category` : undefined}
  class="relative flex h-[30vh] flex-col justify-between transition-[transform,opacity] duration-150 ease-out
    {reorderHandle ? 'cursor-grab select-none touch-none' : ''}
    {inverted ? 'bg-black text-white' : 'bg-white text-black border-r-2 border-black'}"
  style:transform={pressed ? 'translate(-1px, 1px)' : ''}
  {onclick}
>
  <span class="m-6 whitespace-nowrap text-xl font-black uppercase leading-none tracking-tight">{name}</span>
  <ul class="summary-text m-3 space-y-1 text-right">
    {#each summary as line}
      <li>{line}.</li>
    {/each}
  </ul>

</div>
