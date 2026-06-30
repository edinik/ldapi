# Model Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build model metadata CRUD and homepage model overview.

**Architecture:** Extend the existing `models` table and reuse App Router pages/API routes. Add a small pure helper module for model display formatting so homepage presentation logic is testable.

**Tech Stack:** Next.js App Router, React, TypeScript, Drizzle ORM, SQLite, Tailwind CSS.

---

### Task 1: Model Display Helpers

**Files:**
- Create: `src/lib/model-display.ts`
- Create: `tests/model-display.test.ts`

- [ ] Add tests for token formatting, cost formatting, and homepage model filtering.
- [ ] Implement helper functions and exported types.
- [ ] Run model helper tests.

### Task 2: Data Model And API

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/app/api/models/route.ts`
- Create: `src/app/api/models/[id]/route.ts`

- [ ] Add nullable model detail fields while keeping name-only model creation compatible.
- [ ] Add authenticated POST/PUT routes.
- [ ] Add soft delete behavior by setting `isActive` and `showOnHome` false.

### Task 3: Admin UI

**Files:**
- Create: `src/components/ModelForm.tsx`
- Create: `src/app/admin/models/page.tsx`
- Create: `src/app/admin/models/new/page.tsx`
- Create: `src/app/admin/models/[id]/edit/page.tsx`
- Create: `src/app/admin/models/[id]/edit/EditModelClient.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] Add model list and stats.
- [ ] Add new/edit forms with grouped sections.
- [ ] Add admin navigation from station management to model management.

### Task 4: Homepage Overview

**Files:**
- Create: `src/components/ModelOverview.tsx`
- Modify: `src/app/page.tsx`

- [ ] Query active homepage models.
- [ ] Render compact cards with capabilities, modalities, limits, and costs.

### Task 5: Verification

- [ ] Run unit tests.
- [ ] Run lint.
- [ ] Run TypeScript/build verification.
