import {
  type Region,
  type TimeMode,
  VALID_REGIONS,
} from "@2min.today/types";
import { writable } from "svelte/store";

export const searchQuery = writable("");

export const debouncedSearchQuery = writable("");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
searchQuery.subscribe((q) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.set(q);
    debounceTimer = null;
  }, 150);
});

const REGIONS_STORAGE_KEY = "regions";

function readStoredRegions(): Set<Region> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(REGIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((v): v is Region => VALID_REGIONS.has(v) && v !== "world"),
    );
  } catch {
    return new Set();
  }
}

const _activeRegions = writable<Set<Region>>(readStoredRegions());

_activeRegions.subscribe((regions) => {
  if (typeof window === "undefined") return;
  if (regions.size === 0) {
    localStorage.removeItem(REGIONS_STORAGE_KEY);
  } else {
    localStorage.setItem(REGIONS_STORAGE_KEY, JSON.stringify([...regions]));
  }
});

export const activeRegions = {
  subscribe: _activeRegions.subscribe,
  toggle(r: Region) {
    _activeRegions.update((s) => {
      const next = new Set(s);
      if (next.has(r)) {
        next.delete(r);
      } else {
        next.add(r);
      }
      return next;
    });
  },
  clear() {
    _activeRegions.set(new Set());
  },
};

export const timeMode = writable<TimeMode>("local");
