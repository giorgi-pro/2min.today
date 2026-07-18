import type { EmbedContentRequest } from "@google/generative-ai";

export type EmbedRequest = EmbedContentRequest & {
  outputDimensionality?: number;
};
