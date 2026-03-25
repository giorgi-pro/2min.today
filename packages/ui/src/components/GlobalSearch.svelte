<script lang="ts">
  interface Props {
    placeholder?: string;
    class?: string;
  }

  const { placeholder = 'Search digest', class: className }: Props = $props();
</script>

<div class={`min-w-0 max-w-lg flex-1 md:max-w-xl ${className ?? ''}`}>
  <label for="global-search" class="sr-only">Search</label>
  <input
    id="global-search"
    type="search"
    name="q"
    autocomplete="off"
    autocorrect="off"
    spellcheck="false"
    {placeholder}
    class="w-full rounded-none border-2 border-black bg-surface-container-low px-[0.7rem] py-2 font-sans text-sm text-on-surface caret-primary transition-colors placeholder:font-medium placeholder:uppercase placeholder:tracking-label placeholder:text-tertiary focus:border-primary focus:bg-surface-container-lowest focus:outline-none md:text-base"
  />
</div>
