export type TokenClass = "quoted-phrase" | "numeric" | "acronym" | "word";

export interface Token {
  text: string;
  class: TokenClass;
  threshold: number;
}

export interface ParsedQuery {
  tokens: Token[];
  searchString: string;
  threshold: number;
}

export type RawToken = { text: string; quoted: boolean };

export type Transform = (tokens: RawToken[]) => RawToken[];
