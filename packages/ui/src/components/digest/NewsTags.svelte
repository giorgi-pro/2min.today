<script lang="ts">
  type Props = {
    tags: string[];
  };

  const { tags }: Props = $props();
</script>

{#if tags.length > 0}
  <div class="mt-2 flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-[0.55rem] leading-tight opacity-60">
    {#each tags as tag}
      <span>#{tag}</span>
    {/each}
  </div>
{/if}
