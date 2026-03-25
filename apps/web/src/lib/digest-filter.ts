import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const STORAGE_KEY = '2min.today:selectedTags';

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

function loadTagsFromStorage(): string[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    /* ignore */
  }
  return [];
}

export const selectedTags = writable<string[]>(loadTagsFromStorage());

if (browser) {
  selectedTags.subscribe((t) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  });
}

export function toggleTag(tag: string) {
  selectedTags.update((tags) => {
    const i = tags.indexOf(tag);
    if (i === -1) return [...tags, tag];
    return tags.filter((_, j) => j !== i);
  });
}

export function clearAllFilters() {
  searchQuery.set('');
  debouncedSearchQuery.set('');
  selectedTags.set([]);
  if (browser) {
    localStorage.removeItem(STORAGE_KEY);
  }
}
