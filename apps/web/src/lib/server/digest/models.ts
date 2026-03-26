/** Text generation: structured JSON for summarize, classify labels, breaking cards. Use a current stable ID — `gemini-1.5-flash` returns 404 on v1beta. */
export const FLASH_MODEL = 'gemini-2.5-flash'

/** ADR-001: embeddings + pgvector cosine similarity upstream */
export const EMBEDDING_MODEL = 'gemini-embedding-2-preview'

/** Must match `vector(N)` in `supabase/migrations/001-pgvector.sql`. Gemini Embedding 2 defaults to 3072; API truncates when set. */
export const EMBEDDING_DIMENSION = 768
