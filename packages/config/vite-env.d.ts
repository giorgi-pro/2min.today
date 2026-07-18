// Vite `?raw` imports resolve to the file's text content. Declared here and
// referenced from modules that use them (e.g. app/news-sources.ts) so any
// package pulling those modules into its type-check program resolves them.
declare module "*?raw" {
  const content: string;
  export default content;
}
