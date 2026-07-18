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
</script>

<div class={`min-w-0 max-w-lg flex-1 md:max-w-xl ${className ?? ''}`}>
  <input
    id="global-search"
    type="search"
    name="q"
    autocomplete="off"
    autocorrect="off"
    spellcheck="false"
    bind:value
    placeholder="Search..."
    class="w-full appearance-none rounded-none bg-transparent px-[0.7rem] font-sans text-base text-on-surface caret-primary transition-[padding] duration-300 ease-out placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-on-surface/30 focus:outline-none {compact ? 'py-0.5' : 'py-2'} {bordered ? 'border-b-2 border-black focus:border-primary' : 'border-0'}"
    {onfocus}
    {onblur}
  />
</div>
