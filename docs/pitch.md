# Project Pitch: 2min.today

### **The Goal**
To provide a daily, informationally dense **"Global Digest"** that summarizes the world’s most significant news across all topics into a precise two-minute read. It aims to eliminate "news fatigue" by delivering high-signal, low-noise content through a minimalist, **"Modern Brutalist"** interface.

### **The Premise**
Most news AI tools are either over-designed or lack curation. **2min.today** is a digital broadsheet that respects the reader's time. It uses AI to synthesize multiple high-quality sources into a single, cohesive daily edition that feels like a premium physical newspaper from the future.

---

### **Technical Architecture (High Performance)**

| Component | Implementation Strategy |
| :--- | :--- |
| **Frontend** | **SvelteKit + Svelte 5:** Chosen for its "compiler-first" approach, resulting in near-zero runtime overhead and an "instant" feel. |
| **UI System** | **shadcn-svelte:** A "copy-paste" component architecture providing a polished, futuristic aesthetic (Linear-style) with total CSS control. |
| **Ingestion** | Daily automated scan of RSS feeds from top-tier agencies (Reuters, AP, TechCrunch) via SvelteKit Server Actions or scheduled GitHub Actions. |
| **Logic** | **Vector Deduplication:** Uses cosine similarity to group multiple reports of the same event into one "cluster" to avoid redundancy. |
| **Synthesis** | **AI-Native Summarization:** A custom prompt (Gemini 1.5 Flash) transforms raw articles into a structured, high-density format (3 bullets + 1 "Why it Matters" sentence). |
| **Design** | **Modern Brutalist:** High-quality typography (Geist/Inter/Mono), rigid grids, and zero images to prioritize reading speed and performance. |

---

### **The "Portfolio Flex" (Why it stands out)**
* **Precision Engineering:** Choosing **Svelte over React** demonstrates a developer who prioritizes performance, bundle size, and specialized tools over generic industry defaults.
* **Cost Efficiency:** Runs on a **$0 operational budget** (excluding domain) using Vercel, Supabase, and the Gemini Free Tier.
* **Product Thinking:** The "Daily Digest" model proves an understanding of user psychology—moving away from infinite scrolls toward "completed" content.
* **Source Grounding:** Every summary includes direct citations, showcasing a technical solution to the AI hallucination problem.

---

### **Conclusion**
**2min.today** is a low-risk, high-impact technical experiment. By combining the "Modern Brutalist" aesthetic of **shadcn** with the lightweight power of **Svelte**, the project serves as a masterclass in modern web performance and responsible AI implementation.