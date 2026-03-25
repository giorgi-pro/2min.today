<script lang="ts">
  type Props = {
    tag: string;
    selected: boolean;
    onclick: () => void;
  };

  const { tag, selected, onclick }: Props = $props();
</script>

<button
  type="button"
  class="font-mono text-[11px] uppercase tracking-widest border-2 px-1.5 py-0.5 {selected
    ? 'border-black bg-black text-white'
    : 'border-transparent bg-surface-container-low text-black/50 hover:border-black/15 hover:text-black'}"
  aria-pressed={selected}
  {onclick}
>
  {tag}
</button>
