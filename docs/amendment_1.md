### **Categorization System (Added & Refined)**

- **Core 5 Fixed Buckets** (permanent foundation for every edition):
  - World
  - Tech
  - Economy
  - Science
  - Culture

- **Hybrid Classification Logic** (zero bloat):
  - Embeddings + cosine similarity map each summary cluster to one of the 5 core buckets.
  - If max similarity score to all cores < 0.65 → route to rare **Emerging** section.
  - LLM generates one crisp category name + one-line header only for true outliers (<5 % of content).
  - Emerging sections auto-fold back into core buckets on subsequent days unless trend persists.

- Every section opens with a bold one-line topic header for instant scannability (e.g. `**WORLD** • US-China tariff talks escalate`).

### **Sourcing Enhancements (Added)**

- Expand beyond static RSS: combine high-quality feeds (Reuters, AP, etc.) with X semantic search and lightweight trend signals for true “all over the world” coverage.

### **UI & Typography Refinements (Added)**

- SF Mono reserved for source citations and disclaimers.
- Variable font weights (Geist/Inter) + single-pixel dividers for clear hierarchy.
- Rigid grids preserved; zero decorative elements to maintain Modern Brutalist + Apple-inspired density.

**Impact**  
These additions keep the digest predictable, scannable in <3 seconds, and true to the two-minute read promise while allowing controlled flexibility for major global events. No category explosion. Pure signal.