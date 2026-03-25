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

  <div class="display-wrapper">
    <p class="display ghost" aria-hidden="true">88<span>:</span>88<span>:</span>88</p>
    <p class="display live">
      {hours}<span class="colon" style="animation-delay: {animationDelay}">:</span>{minutes}<span class="colon" style="animation-delay: {animationDelay}">:</span>{seconds}
    </p>
  </div>

  <p class="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-black/40">{dateLabel()}</p>
</div>

<style>
  .timer-tile {
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

  .colon {
    animation: blink 1s steps(2, start) infinite;
  }

  @keyframes blink {
    to { visibility: hidden; }
  }

  @media (prefers-reduced-motion: reduce) {
    .colon {
      animation: none;
      visibility: visible;
    }
  }
</style>
