import Fuse, { type IFuseOptions } from "fuse.js";
import type { ParsedQuery } from "@2min.today/types";
import { parseQuery } from "./query-parser";

export interface SearchStrategy<T> {
  search(parsed: ParsedQuery, cards: T[]): T[];
}

export class ThresholdStrategy<T> implements SearchStrategy<T> {
  private fuseOptions: IFuseOptions<T>;

  constructor(fuseOptions: Omit<IFuseOptions<T>, "threshold">) {
    this.fuseOptions = fuseOptions;
  }

  search(parsed: ParsedQuery, cards: T[]): T[] {
    const index = new Fuse(cards, {
      ...this.fuseOptions,
      threshold: parsed.threshold,
    });
    return index.search(parsed.searchString).map((r) => r.item);
  }
}

export class SearchHandler<T> {
  constructor(
    private strategy: SearchStrategy<T>,
    private globalThreshold: number,
  ) {}

  handle(raw: string, cards: T[]): T[] {
    const parsed = parseQuery(raw, this.globalThreshold);
    if (!parsed) return cards;
    return this.strategy.search(parsed, cards);
  }
}
