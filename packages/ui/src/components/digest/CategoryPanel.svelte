<script lang="ts">
  type Props = {
    name: string;
    summary: string[];
    inverted: boolean;
    pressed: boolean;
    marqueeEnabled: boolean;
    el?: HTMLElement;
    onmouseenter: () => void;
    onmouseleave: () => void;
    onmousemove: (e: MouseEvent) => void;
    onclick: (e: MouseEvent) => void;
    draggable?: boolean;
    dragging?: boolean;
    dropTarget?: boolean;
    ondragstart?: (e: DragEvent) => void;
    ondrag?: (e: DragEvent) => void;
    ondragend?: (e: DragEvent) => void;
  };

  let {
    name,
    summary,
    inverted,
    pressed,
    marqueeEnabled,
    el = $bindable(),
    onmouseenter,
    onmouseleave,
    onmousemove,
    onclick,
    draggable = false,
    dragging = false,
    dropTarget = false,
    ondragstart,
    ondrag,
    ondragend,
  }: Props = $props();
</script>

<div
  role="presentation"
  draggable={draggable}
  class="relative flex h-[30vh] flex-col justify-between transition-[transform,opacity] duration-150 ease-out
    {draggable ? (dragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none') : ''}
    {dragging ? 'opacity-50' : ''}
    {dropTarget
      ? `before:pointer-events-none before:absolute before:inset-2 before:box-border before:border before:border-dashed before:content-[''] ${inverted ? 'before:border-white/40' : 'before:border-black/25'}`
      : ''}
    {inverted ? 'bg-black text-white' : 'bg-white text-black border-r-2 border-black'}"
  style:transform={pressed ? 'translate(-1px, 1px)' : ''}
  bind:this={el}
  {onmouseenter}
  {onmouseleave}
  {onmousemove}
  {onclick}
  {ondragstart}
  {ondrag}
  {ondragend}
>
  <span class="m-6 whitespace-nowrap text-xl font-black uppercase leading-none tracking-tight">{name}</span>
  <ul class="summary-text m-3 space-y-1 text-right">
    {#each summary as line}
      <li>{line}.</li>
    {/each}
  </ul>

</div>
