# Design System Document: Editorial Brutalism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Ledger."** This is a high-density, information-first framework that treats news not as entertainment, but as vital infrastructure. 

By merging the raw, structural honesty of **Modern Brutalism** with the precision of **Futuristic Minimalism**, we move away from "interface" and toward "content-as-canvas." We reject the fluff of the modern web—rounded corners, soft shadows, and decorative imagery—in favor of a rigid, high-contrast typographic environment. The experience should feel like a high-end financial terminal met a Swiss-style broadsheet: authoritative, ultra-fast, and unapologetically dense.

---

## 2. Colors & Tonal Architecture
The palette is restricted to a high-contrast monochromatic base with a singular functional accent. We utilize the Material Design naming convention to map a sophisticated grayscale hierarchy.

### The Palette
- **Primary / On-Background:** `#000000` (Pure Black) - Used for primary headlines and grounding elements.
- **Surface / Background:** `#f9f9f9` (Off-White) - Softens the starkness of pure white for long-form reading.
- **Secondary:** `#ff6347` (Orangey) - Reserved strictly for interactive links and active states.
- **Surface Containers:** A range from `#ffffff` (Lowest) to `#e2e2e2` (Highest) for subtle grouping.

### The "No-Line" Rule (Refinement)
While the prompt suggests 1px dividers, our directorial directive is to **evolve beyond the line.** Use 1px dividers (`outline_variant`) exclusively for the **Global Grid** (headers and main navigation). Inside the content feed, boundaries must be defined by **Background Color Shifts**. 
- *Example:* A "Breaking News" block uses `surface_container_high` (`#e8e8e8`) against the `surface` background to create a hard-edged block without a border.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, precision-cut sheets.
- **Level 0 (Base):** `surface` (`#f9f9f9`)
- **Level 1 (Feed Items):** `surface_container_low` (`#f3f3f4`)
- **Level 2 (Active/Hover):** `surface_container_highest` (`#e2e2e2`)
This nesting creates depth through value rather than shadows.

---

## 3. Typography: The Variable Engine
Typography is the primary design tool. We utilize **Inter** for its neutral, architectural clarity and **SF Mono** to provide a "data-driven" futuristic aesthetic for metadata.

### The Hierarchy
- **Display-LG (3.5rem / Bold):** Reserved for massive, impactful daily headlines. Tracking: -0.02em.
- **Headline-MD (1.75rem / Semi-Bold):** Primary news titles. High density, tight leading (1.1).
- **Title-SM (1rem / Medium):** Sub-headlines and category headers.
- **Body-MD (0.875rem / Regular):** The core reading experience. Leading: 1.5 for maximum legibility.
- **Label-SM (0.6875rem / SF Mono / Medium):** Citations, timestamps, and source data. All-caps for a "teletype" feel.

**Variable Weights:** Avoid using color to show hierarchy (e.g., light gray text). Instead, shift from **Bold** for headlines to **Regular** for body, and **Light** for secondary details, all while maintaining high contrast (`#1a1c1c`).

---

## 4. Elevation & Depth
In this system, "Elevation" is a misnomer. We do not elevate; we **carve.**

- **Tonal Layering:** To highlight a specific article, do not use a shadow. Instead, change the container color from `surface` to `surface_container_lowest` (`#ffffff`). This "lifts" the content through brightness.
- **The "Ghost Border" Fallback:** In high-density lists where tonal shifts are too subtle, use a 1px divider using `outline_variant` at **20% opacity**. It should feel like a faint pencil mark, not a structural wall.
- **Zero Roundedness:** All `border-radius` tokens are set to `0px`. The UI is composed of sharp, 90-degree intersections to reinforce the brutalist ethos.

---

## 5. Components

### Cards & News Items
- **Structure:** No borders. 
- **Separation:** Use `spacing.8` (1.75rem) of vertical white space or a subtle shift to `surface_container`.
- **Interaction:** On hover, the entire card background shifts to `surface_container_highest`.

### Buttons
- **Primary:** Pure Black (`#000000`) background, White (`#ffffff`) text. Square edges.
- **Secondary:** 1px Ghost Border (`outline`). No fill. 
- **Typography:** Always use `Label-MD` (Inter, Bold) for button labels.

### Chips (Category Tags)
- **Style:** `SF Mono` text, `0.6875rem`. 
- **Visual:** A simple `#000000` 1px border. No background fill unless active.

### Input Fields
- **Style:** Underline-only (1px `primary`). No box. 
- **Focus State:** Underline thickens to 2px. Label shifts to `SF Mono` above the field.

### Progress Bars (Reading Indicator)
- **Visual:** A 2px line at the very top of the viewport. Use `secondary` (`#ff6347`) to show progress against a `surface_variant` background.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace Density:** Use `spacing.2` and `spacing.3` to keep information packed. This is a tool for power users.
- **Use "SF Mono" for Numbers:** Any data point (time, count, date) should be in Mono to feel like a live data feed.
- **Align to a Rigid Grid:** Every element must snap to a column. Asymmetry should be intentional (e.g., a headline spanning 8 columns while metadata stays in 2).

### Don’t:
- **Don’t use Border Radius:** Any curve, even 2px, breaks the brutalist language.
- **Don’t use Soft Grays for Text:** If text is important, it must be `on_surface`. If it’s meta, use a lighter weight, not a lighter color.
- **Don’t use Icons for Decorations:** Only use icons (Chevron, Search) for functional actions. Never use icons to "illustrate" a category.
