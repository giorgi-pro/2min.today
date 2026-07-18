<script lang="ts">
  interface Props {
    tags: string[];
  }

  const { tags }: Props = $props();
</script>

{#if tags.length > 0}
  <div class="summary-text mt-2 flex flex-wrap justify-end gap-x-2 gap-y-0.5">
    {#each tags as tag (tag)}
      <span>#{tag}</span>
    {/each}
  </div>
{/if}
