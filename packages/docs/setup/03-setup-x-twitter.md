# 03-setup-x-twitter.md

**X API v2 (Recent Search) for the digest fetch path**

## 1. Bearer token (~few minutes)

1. Open [developer.x.com](https://developer.x.com) and sign in
2. **Create project** (e.g. `2min-today-digest`)
3. **Add app** (e.g. `daily-digest`)
4. Under keys and tokens, copy the **Bearer token**

## 2. Add to `apps/web/.env`

```env
X_BEARER_TOKEN="AAAAAAAAAAAAAAAA..."
```

## 3. How it is used

The app uses `twitter-api-v2` with a search query tuned for news-style posts (English, minimum engagement, filters on replies/quotes). Volume is low (on the order of tens of results per day), so cost stays small on pay-as-you-go tiers.

## 4. Rate limits

The Basic tier’s request window (for example 60 requests per 15 minutes) is sufficient for a daily cron plus a ~15-minute breaking-news ping from GitHub Actions.
