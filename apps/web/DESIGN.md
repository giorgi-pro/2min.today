# The Design System: High-End Editorial Brutalism

## 1. Overview & Creative North Star: "The Digital Ledger"
The design system is built upon the Creative North Star of **"The Digital Ledger."** It moves away from the "app-like" clutter of modern social networks toward a high-end, editorial aesthetic that feels like a premium broadsheet or a bespoke architectural portfolio. 

By rejecting standard UI tropes—like heavy drop shadows, rounded "pill" buttons, and complex navigation—we create a sense of **Honest Brutalism**. The design system breaks the "template" look through intentional asymmetry: text is often justified or tracked tightly to create density, while massive white space (using the `spacing-20` and `spacing-24` tokens) provides breathing room. It is a system designed for speed, scannability, and authority.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a strict monochrome foundation, using the `primary` (#293be6) only as a functional beacon for action and availability.

### The "No-Line" Rule
To maintain the "Digital Ledger" aesthetic, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background shifts. For example:
- A candidate card (`surface-container-lowest`) sits directly on a `surface` background.
- A "Featured" section is defined by a full-width shift to `surface-container-low`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of premium paper.
*   **Base:** `surface` (#f7f9ff) – The desk.
*   **Sections:** `surface-container-low` (#f1f4f9) – Large structural areas.
*   **Cards/Elements:** `surface-container-lowest` (#ffffff) – The active sheet.
*   **Interaction/Active:** `surface-dim` (#d7dadf) – For pressed or inactive states.

### Signature Textures
While the user request specifies "no gradients," we apply a **"Micro-Texture"** approach to main CTAs. Use a subtle shift from `primary` (#293be6) to `primary_container` (#4859ff) over a 45-degree angle. This prevents the primary blue from feeling "flat" or "web-safe," giving it the depth of high-quality ink.

---

## 3. Typography: The Editorial Voice
We utilize **Inter** not as a standard sans-serif, but as a structural element. 

*   **Display & Headlines:** Use `display-md` (2.75rem) for hero statements. Set letter-spacing to `-0.02em` to create a "tight" professional feel. 
*   **The Power of Labels:** Use `label-md` (uppercase, tracked out +10%) for metadata like "LOCATION" or "SALARY." This contrasts against the `body-lg` candidate descriptions, creating an information hierarchy that mimics a printed resume.
*   **Honest Body:** `body-md` (0.875rem) is the workhorse. It must always have a line height of at least 1.5 to ensure the "high whitespace" vibe is maintained within the text blocks themselves.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are replaced by **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking." A profile card (`surface-container-lowest`) placed on a `surface-container` background creates a natural lift.
*   **The "Ghost Border" Fallback:** In edge cases where accessibility requires a container (e.g., input fields), use the **Ghost Border**: the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism & Depth:** For mobile navigation bars or floating "Apply" buttons, use `surface-container-lowest` with a `0.8` opacity and a `20px` backdrop blur. This allows candidate data to bleed through subtly, maintaining the "zero bloat" transparency.

---

## 5. Components: Functional Brutalism

### Buttons
*   **Primary:** Solid `primary` (#293be6) fill, `on_primary` text. **Radius: 0px**.
*   **Secondary:** `surface-container-high` fill, `on_surface` text. **Radius: 0px**.
*   **Hover State:** Shift background to `primary_container`. No shadow.

### Profiles & Square Assets
*   **Avatar:** Strictly **120px x 120px square**. No radius. This is a signature "Staff.pro" look that differentiates it from the circular trend.
*   **Status Indicator:** A 12px solid circle using the `primary` (or a specific green) placed precisely at the bottom-right of the square image.

### Cards & Lists
*   **No Dividers:** Forbid the use of line dividers. Use `spacing-8` (2.75rem) to separate list items.
*   **Information Density:** Align all text to a single left-hand axis to reinforce the single-column `max-w-2xl` layout.

### Input Fields
*   **Style:** `surface-container-low` background with a `bottom-border` only (using `outline-variant` at 20%). 
*   **Active:** The bottom border transforms into a 2px solid `primary` line.

### Chips (Skills/Tags)
*   **Style:** `secondary_fixed` (#e0e3e8) background, `on_secondary_fixed` text. 
*   **Shape:** 4px radius (`DEFAULT` roundedness scale). 

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme vertical whitespace. If a section feels "tight," double the spacing token (e.g., move from `spacing-10` to `spacing-20`).
*   **Do** keep the `max-w-2xl` constraint religious. Content should never bleed wider; it preserves the "Ledger" scannability.
*   **Do** use `primary` sparingly. It is a tool for direction, not decoration.

### Don't
*   **Don't** use 100% black (#000) for text. Use `on_surface` (#181c20) to maintain a premium, ink-on-paper feel.
*   **Don't** use standard shadows. If an element needs to "pop," use a background color shift or a "Ghost Border."
*   **Don't** use icons where text will suffice. A label saying "MENU" is more "Honest" than a hamburger icon.

---

## 7. Spacing Utility
All layouts must adhere to the **0.7rem increment** (Token `spacing-2`). 
*   **Container Padding:** `spacing-6` (2rem).
*   **Component Gap:** `spacing-3` (1rem).
*   **Section Break:** `spacing-16` (5.5rem).