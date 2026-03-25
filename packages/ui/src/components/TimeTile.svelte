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

  <div class="display-wrapper">
    <p class="display ghost" aria-hidden="true">{ghost}</p>
    <p class="display live">{displayTime()}</p>
  </div>
</div>

<style>
  .time-tile {
    font-family: 'DSEG7', monospace;
  }

  .display-wrapper {
    position: relative;
    line-height: 1;
  }

  .display {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
  }

  .ghost {
    position: absolute;
    top: 0;
    left: 0;
    color: rgba(0, 0, 0, 0.08);
    pointer-events: none;
    user-select: none;
  }

  .live {
    position: relative;
    color: #1B242C;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.15);
  }
</style>
