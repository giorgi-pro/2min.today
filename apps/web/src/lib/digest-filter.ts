import { writable } from 'svelte/store';

export const searchQuery = writable('');

export const debouncedSearchQuery = writable('');

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
searchQuery.subscribe((q) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.set(q);
    debounceTimer = null;
  }, 150);
});
