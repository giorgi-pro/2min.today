<script lang="ts">
  interface Props {
    header: string;
    content: string;
  }

  const { header, content }: Props = $props();
</script>

<div class="flex flex-1 flex-col gap-1.5 border-2 border-black p-5">
  <p class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40">{header}</p>
  <p class="font-mono text-[1.6rem] font-bold tracking-tight text-black">{content}</p>
</div>
