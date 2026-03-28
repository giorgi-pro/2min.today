<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  const { utc, ontoggle }: { utc: boolean; ontoggle: () => void } = $props();

  let now = $state(new Date());
  let animationDelay = $state('0ms');
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    animationDelay = `-${now.getMilliseconds()}ms`;
    interval = setInterval(() => {
      now = new Date();
    }, 1000);
  });

  onDestroy(() => clearInterval(interval));

  const pad = (n: number) => String(n).padStart(2, '0');

  const hours = $derived(pad(utc ? now.getUTCHours() : now.getHours()));
  const minutes = $derived(pad(utc ? now.getUTCMinutes() : now.getMinutes()));
  const seconds = $derived(pad(utc ? now.getUTCSeconds() : now.getSeconds()));

  const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const dateLabel = $derived(() => {
    const day = utc ? now.getUTCDay() : now.getDay();
    const date = utc ? now.getUTCDate() : now.getDate();
    const month = utc ? now.getUTCMonth() : now.getMonth();
    const year = utc ? now.getUTCFullYear() : now.getFullYear();
    return `${DAY_NAMES[day]} — ${date} ${MONTH_NAMES[month]} ${year}`;
  });

  const timezone = $derived(utc ? 'UTC' : Intl.DateTimeFormat().resolvedOptions().timeZone);
</script>

<div class="timer-tile flex flex-1 flex-col gap-3 border-2 border-black p-5">
  <div class="flex items-center justify-between">
    <p class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40">Current Time</p>
    <button
      onclick={ontoggle}
      class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40 transition-opacity hover:text-black/70 cursor-pointer"
    >
      {timezone}
    </button>
  </div>

  <div class="tile-display-wrapper">
    <p class="tile-display tile-display-ghost text-black/[8%]" aria-hidden="true">88<span>:</span>88<span>:</span>88</p>
    <p class="tile-display tile-display-live [text-shadow:0_0_2px_rgba(0,0,0,0.15)]">
      {hours}<span class="timer-colon" style="animation-delay: {animationDelay}">:</span>{minutes}<span class="timer-colon" style="animation-delay: {animationDelay}">:</span>{seconds}
    </p>
  </div>

  <p class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40">{dateLabel()}</p>
</div>
