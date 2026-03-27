<script lang="ts">
  const { header, content }: { header: string; content: string } = $props();
</script>

<div class="flex flex-1 flex-col gap-1.5 border-2 border-black p-5">
  <p class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40">{header}</p>
  <p class="font-mono font-bold tracking-tight text-black" style="font-size: 1.6rem;">{content}</p>
</div>
