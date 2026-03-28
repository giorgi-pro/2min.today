<script lang="ts">
  const { header, time, utc, ontoggle }: { header: string; time: string; utc: boolean; ontoggle: () => void } = $props();

  const displayTime = $derived(() => {
    if (utc) return time;
    const parts = time.split(':').map(Number);
    const d = new Date();
    d.setUTCHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  const timezone = $derived(utc ? 'UTC' : Intl.DateTimeFormat().resolvedOptions().timeZone);
  const ghost = $derived(displayTime().replace(/[0-9]/g, '8'));
</script>

<div class="time-tile flex flex-1 flex-col gap-3 border-2 border-black p-5">
  <div class="flex items-center justify-between">
    <p class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40">{header}</p>
    <button
      onclick={ontoggle}
      class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40 transition-opacity hover:text-black/70 cursor-pointer"
    >
      {timezone}
    </button>
  </div>

  <div class="tile-display-wrapper">
    <p class="tile-display tile-display-ghost text-black/[8%]" aria-hidden="true">{ghost}</p>
    <p class="tile-display tile-display-live [text-shadow:0_0_2px_rgba(0,0,0,0.15)]">{displayTime()}</p>
  </div>
</div>
