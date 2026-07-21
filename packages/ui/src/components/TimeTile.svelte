<script lang="ts">
  import { formatDigestRunClock, formatDigestRunDate, getLocalTimezoneLabel } from '@utils';

  interface Props {
    header: string;
    time: string | null;
    utc: boolean;
    ontoggle: () => void;
  }

  const { header, time, utc, ontoggle }: Props = $props();

  // Date goes in the small header row; the big digital display only ever
  // holds HH:MM, same character budget as TimerTile, so it never needs to
  // shrink to fit — narrow tiles can't fit "DD.MM HH:MM" at a readable size.
  const displayDate = $derived(time ? formatDigestRunDate(time, utc) : '--.--');
  const displayTime = $derived(time ? formatDigestRunClock(time, utc) : '--:--');
  const timezone = $derived(utc ? 'UTC' : getLocalTimezoneLabel());
  const ghost = $derived(displayTime.replace(/[0-9]/g, '8'));
</script>

<div class="time-tile flex flex-1 flex-col gap-3 border-2 border-black p-5">
  <div class="flex items-center justify-between gap-2">
    <p class="min-w-0 truncate font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40">{header} · {displayDate}</p>
    <button
      onclick={ontoggle}
      class="shrink-0 cursor-pointer font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40 transition-opacity hover:text-black/70"
    >
      {timezone}
    </button>
  </div>

  <div class="tile-display-wrapper">
    <p class="tile-display tile-display-ghost text-black/[8%]" aria-hidden="true">{ghost}</p>
    <p class="tile-display tile-display-live [text-shadow:0_0_2px_rgba(0,0,0,0.15)]">{displayTime}</p>
  </div>
</div>
