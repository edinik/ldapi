# LDAPI UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the full LDAPI public and admin interface using the warm editorial design language in `DESIGN.md`.

**Architecture:** Keep the existing Next.js App Router pages and data flow intact. Apply a shared design system through `src/app/globals.css`, then update each page/component with token-driven Tailwind classes and semantic HTML. No database, API, or auth behavior changes are in scope.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript.

---

### Task 1: Global Design Tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace default colors with DESIGN.md tokens**

Set cream canvas, warm ink, coral primary, hairline, light cards, and dark product surface CSS variables in `:root`.

- [ ] **Step 2: Add reusable base classes**

Add utility classes for `.ld-page`, `.ld-container`, `.ld-button-primary`, `.ld-button-secondary`, `.ld-card`, `.ld-input`, `.ld-label`, `.ld-badge`, and `.ld-section-title`.

- [ ] **Step 3: Align layout metadata**

Keep `zh-CN` and metadata, but ensure body uses the new background, text color, and font stack.

### Task 2: Public Directory Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Preserve existing data query**

Keep active-site query, model extraction, and dynamic rendering unchanged.

- [ ] **Step 2: Add derived stats**

Calculate active site count, unique model count, Claude Code count, Codex count, and check-in count from `siteList`.

- [ ] **Step 3: Redesign header and hero**

Implement warm navigation, editorial hero copy, stats pills, and a dark product-surface summary panel.

- [ ] **Step 4: Redesign site cards**

Use cream cards with coral links, structured capability badges, model pills, metadata rows, and related-link footer.

- [ ] **Step 5: Keep empty state polished**

Use a cream card empty state with clear text instead of a plain gray paragraph.

### Task 3: Login Page

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Keep login behavior unchanged**

Preserve POST `/api/auth/login`, loading state, error state, and redirect to `/admin`.

- [ ] **Step 2: Apply warm auth layout**

Use a centered cream page with a dark editorial side panel and a light login form card.

- [ ] **Step 3: Improve form accessibility**

Keep labels, add `autoComplete`, use visible focus rings, and make loading disabled state clear.

### Task 4: Admin Dashboard

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Keep auth and query unchanged**

Preserve `requireAdmin`, site query, model relation, and ordering.

- [ ] **Step 2: Add summary stats**

Calculate total sites, active sites, inactive sites, check-in sites, and model relation count.

- [ ] **Step 3: Redesign shell and table**

Use warm dashboard header, stat cards, coral add button, secondary logout button, and a responsive table wrapper.

- [ ] **Step 4: Improve empty state**

Use a card empty state with direct add-site action.

### Task 5: Site Create/Edit Pages and Form

**Files:**
- Modify: `src/app/admin/sites/new/page.tsx`
- Modify: `src/app/admin/sites/[id]/edit/page.tsx`
- Modify: `src/app/admin/sites/[id]/edit/EditSiteClient.tsx`
- Modify: `src/components/SiteForm.tsx`

- [ ] **Step 1: Redesign create/edit shells**

Add consistent page header, back link, description, and max-width behavior.

- [ ] **Step 2: Restyle `SiteForm` fieldsets**

Use warm cards per section, clear legends, consistent labels, inputs, textareas, and checkboxes.

- [ ] **Step 3: Restyle model tag editor**

Use token-based model pills, accessible remove buttons, and a secondary add button.

- [ ] **Step 4: Restyle submit and delete controls**

Use coral primary submit button, clear disabled state, and a distinct but restrained destructive delete action.

### Task 6: Verification

**Files:**
- No direct edits.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

- [ ] **Step 2: Run production build**

Run: `npm run build`

- [ ] **Step 3: Start dev server if build passes**

Run: `npm run dev` and provide the local URL if available.

- [ ] **Step 4: Report exact verification results**

Report commands, exit status, and any remaining issues.
