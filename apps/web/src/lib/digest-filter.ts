import { writable } from 'svelte/store';
import { VALID_REGIONS, type Region } from '$lib/types/digest';

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

const REGION_STORAGE_KEY = 'region';

function readStoredRegion(): Region {
  if (typeof window === 'undefined') return 'global';
  const stored = localStorage.getItem(REGION_STORAGE_KEY);
  if (stored && VALID_REGIONS.has(stored as Region) && stored !== 'global') {
    return stored as Region;
  }
  return 'global';
}

const _activeRegion = writable<Region>(readStoredRegion());

_activeRegion.subscribe((r) => {
  if (typeof window === 'undefined') return;
  if (r === 'global') {
    localStorage.removeItem(REGION_STORAGE_KEY);
  } else {
    localStorage.setItem(REGION_STORAGE_KEY, r);
  }
});

export const activeRegion = {
  subscribe: _activeRegion.subscribe,
  set: (r: Region) => _activeRegion.set(r),
};

export type TimeMode = 'local' | 'utc';
export const timeMode = writable<TimeMode>('local');
