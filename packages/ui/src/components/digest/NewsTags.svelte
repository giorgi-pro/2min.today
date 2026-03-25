<script lang="ts">
  import NewsTag from './NewsTag.svelte';

  type Props = {
    tags: string[];
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
  };

  const { tags, selectedTags, onToggleTag }: Props = $props();
</script>

{#if tags.length > 0}
  <div class="pointer-events-auto absolute bottom-3 right-3 flex max-w-[85%] flex-wrap justify-end gap-1">
    {#each tags as tag}
      <NewsTag {tag} selected={selectedTags.includes(tag)} onclick={() => onToggleTag(tag)} />
    {/each}
  </div>
{/if}
