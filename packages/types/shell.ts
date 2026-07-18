import type { Snippet } from "svelte";
import type { Region } from "./digest.js";

export type ShellRegion = Region;

export interface ShellLayoutProps {
  searchQuery?: string;
  activeRegions?: Set<ShellRegion>;
  onRegionToggle?: (r: ShellRegion) => void;
  onRegionClear?: () => void;
  children: Snippet;
}
