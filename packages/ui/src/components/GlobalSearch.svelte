<script lang="ts">
  interface Props {
    class?: string;
    value?: string;
    compact?: boolean;
    bordered?: boolean;
    onfocus?: () => void;
    onblur?: () => void;
  }

  let {
    class: className,
    value = $bindable(''),
    compact = false,
    bordered = true,
    onfocus,
    onblur,
  }: Props = $props();

  let inputEl: HTMLInputElement | undefined = $state();

  function clear() {
    value = '';
    inputEl?.focus();
  }
</script>

<div class={`relative min-w-0 max-w-lg flex-1 md:max-w-xl ${className ?? ''}`}>
  <input
    id="global-search"
    type="search"
    name="q"
    autocomplete="off"
    autocorrect="off"
    spellcheck="false"
    bind:value
    bind:this={inputEl}
    placeholder="Search..."
    class="w-full appearance-none rounded-none bg-transparent px-[0.7rem] font-sans text-base text-on-surface caret-primary transition-[padding] duration-300 ease-out placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-on-surface/30 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none {compact ? 'py-0.5' : 'py-2'} {value ? 'pr-7' : ''} {bordered ? 'border-b-2 border-black focus:border-primary' : 'border-0'}"
    {onfocus}
    {onblur}
  />
  {#if value}
    <button
      type="button"
      onclick={clear}
      aria-label="Clear search"
      class="absolute right-0 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-on-surface/40 hover:text-primary"
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="h-3 w-3">
        <path d="M2 2l12 12M14 2L2 14" />
      </svg>
    </button>
  {/if}
</div>
