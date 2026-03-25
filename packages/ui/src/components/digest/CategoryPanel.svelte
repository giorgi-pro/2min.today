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
  };

  let { name, summary, inverted, pressed, marqueeEnabled, el = $bindable(), onmouseenter, onmouseleave, onmousemove, onclick }: Props = $props();
</script>

<div
  role="presentation"
  class="flex h-[30vh] flex-col justify-between transition-transform duration-150 ease-out
    {inverted ? 'bg-black text-white' : 'bg-white text-black border-r-2 border-black'}
    {marqueeEnabled ? 'cursor-grab' : 'cursor-pointer'}"
  style:transform={pressed ? 'translate(-1px, 1px)' : ''}
  bind:this={el}
  {onmouseenter}
  {onmouseleave}
  {onmousemove}
  {onclick}
>
  <span class="m-6 whitespace-nowrap text-xl font-black uppercase leading-none tracking-tight">{name}</span>
  <ul class="m-3 space-y-1 text-right">
    {#each summary as line}
      <li class="summary-text">{line}.</li>
    {/each}
  </ul>
</div>
