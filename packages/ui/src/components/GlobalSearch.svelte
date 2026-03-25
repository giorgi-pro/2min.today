<script lang="ts">
  interface Props {
    class?: string;
    value?: string;
  }

  let {
    class: className,
    value = $bindable(''),
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
    class="w-full rounded-none border-b-2 border-black bg-transparent px-[0.7rem] py-2 font-sans text-sm text-on-surface caret-primary transition-colors placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-on-surface/30 focus:border-primary focus:outline-none md:text-base"
  />
</div>
