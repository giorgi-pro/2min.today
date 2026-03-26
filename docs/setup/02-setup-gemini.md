# 02-setup-gemini.md

**Gemini API key for embeddings and summarization (ADR-001)**

## 1. Get a key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Create API key**
3. Copy the key (typically starts with `AIza`)

## 2. Add to `apps/web/.env`

```env
GEMINI_API_KEY="AIzaSy..."
```

## 3. Models (pipeline defaults)

- Embeddings: `gemini-embedding-2-preview`
- Summarization: `gemini-2.5-flash` (structured JSON; `FLASH_MODEL` in `lib/server/digest/models.ts`)

## 4. Quotas

Free tier is usually enough for a daily digest (on the order of tens of stories) plus breaking-news checks; no billing is required for early experiments.
