import type { Snippet } from 'svelte';

export type ShellRegion = 'world' | 'europe' | 'americas' | 'middle-east' | 'usa';

export interface ShellLayoutProps {
  searchQuery?: string;
  activeRegions?: Set<ShellRegion>;
  onRegionToggle?: (r: ShellRegion) => void;
  onRegionClear?: () => void;
  children: Snippet;
}
